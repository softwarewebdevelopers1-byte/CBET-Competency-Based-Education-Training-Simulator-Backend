import { StorageClient } from "@supabase/storage-js";
import { Router, type Request, type Response } from "express";
import { existsSync, mkdirSync } from "fs";
import { readFile, unlink } from "fs/promises";
import multer from "multer";
import path from "path";
import { AuthenticateToken } from "#Verification/access.token";
import { UnitDocumentModel } from "#models/unit.document.model";
import { User } from "#models/user.model";
import { UnitAssignment } from "#models/unit.assignment.model";
import { GenerateOTP } from "#Verification/OTP.verify";

const uploadDirectory = path.resolve("./users_uploads");
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

const uploads = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDirectory);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${GenerateOTP()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for typical documents
  fileFilter(_req: Request, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files allowed"));
  },
});

const UnitDocumentUploadRouter = Router();

const getStorageClient = (): StorageClient => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    throw new Error("Missing Supabase credentials");
  }

  const storageUrl = `https://${supabaseUrl}.supabase.co/storage/v1`;

  return new StorageClient(storageUrl, {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  });
};

const getCurrentUser = async (req: Request) => {
  const userNumber =
    String(
      (req.user as { userNumber?: string } | undefined)?.userNumber ?? "",
    ).trim() || String(req.cookies?.user_1UA_XG ?? "").trim();

  if (!userNumber) {
    return null;
  }

  return User.findOne({ UserNumber: userNumber }).lean().exec();
};

const isAdminUser = (role: unknown) =>
  String(role ?? "").trim().toLowerCase() === "admin";

const isTrainerUser = (role: unknown) =>
  String(role ?? "").trim().toLowerCase() === "trainer";

const getAssignedUnitForUploader = async (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  unitCodeInput: string,
  unitNameInput: string,
) => {
  const normalizedUnitCode = String(unitCodeInput ?? "").trim();
  const normalizedUnitName = String(unitNameInput ?? "").trim();

  if (isAdminUser(user.role)) {
    return null;
  }

  const assignmentType = isTrainerUser(user.role) ? "lecturer" : "trainee";
  const assignmentFilters: Record<string, unknown> = {
    assignmentType,
    assigneeUserNumber: user.UserNumber,
  };

  if (normalizedUnitCode) {
    assignmentFilters.unitCode = {
      $regex: new RegExp(`^${normalizedUnitCode}$`, "i"),
    };
  } else if (normalizedUnitName) {
    assignmentFilters.unitName = {
      $regex: new RegExp(`^${normalizedUnitName}$`, "i"),
    };
  } else {
    throw new Error("unit_lookup_required");
  }

  const assignment = await UnitAssignment.findOne(assignmentFilters).lean().exec();
  if (!assignment) {
    return null;
  }

  return assignment;
};

UnitDocumentUploadRouter.post(
  "/",
  AuthenticateToken,
  uploads.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const filePath = req.file?.path;

    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !(isAdminUser(currentUser.role) || isTrainerUser(currentUser.role))) {
        res.status(403).json({ error: "Admin or lecturer privileges required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Please upload a PDF file" });
        return;
      }

      const unitCodeInput = String(req.body.unitCode ?? "").trim();
      const unitNameInput = String(req.body.unitName ?? "").trim();
      let assignedProgramme = String(req.body.assignedProgramme ?? "").trim();
      const assignedDepartment = String(req.body.assignedDepartment ?? "").trim();
      const description = String(req.body.description ?? "").trim();
      const yearOfStudy = Math.max(1, Number(req.body.yearOfStudy) || 1);
      
      const assignment = await getAssignedUnitForUploader(
        currentUser,
        unitCodeInput,
        unitNameInput,
      );

      if (!isAdminUser(currentUser.role) && !assignment) {
        res.status(403).json({
          error:
            "You can only upload documents for units assigned to you. Provide assigned unit code or unit name.",
        });
        return;
      }

      const unitCode = assignment?.unitCode ?? unitCodeInput;
      const unitName = assignment?.unitName ?? unitNameInput;
      const courseTitleInput = String(req.body.courseTitle ?? "").trim();
      const courseTitle = assignment?.courseTitle ?? courseTitleInput;

      if (!assignedProgramme) {
        assignedProgramme = assignment?.courseTitle ?? courseTitle;
      }

      if (!courseTitle || !unitName || !unitCode || !assignedProgramme) {
        res.status(400).json({
          error:
            "courseTitle, unitName, unitCode, and assignedProgramme are required",
        });
        return;
      }

      const localFilePath = req.file.path;
      const storageClient = getStorageClient();
      const bucket = process.env.SUPABASE_BUCKET;
      if (!bucket) {
        throw new Error("bucket name is required");
      }
      const fileName = `${Date.now()}-${GenerateOTP()}-${req.file.originalname}`;
      const storagePath = `${assignedProgramme}/${unitCode}/materials/${fileName}`;
      const fileBuffer = await readFile(localFilePath);

      const uploadResult = await storageClient
        .from(bucket)
        .upload(storagePath, fileBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadResult.error) {
        console.log(uploadResult.error);
        res.status(500).json({
          error: "Failed to upload PDF to Supabase",
          details: uploadResult.error.message,
        });
        return;
      }

      const { data: publicUrlData } = storageClient
        .from("campusHub_PDF") // fallback if your bucket is different from public url bucket
        .getPublicUrl(storagePath);
        
      // Ensure we use the correct bucket for the URL if they match
      const pdfUrl = publicUrlData.publicUrl.replace("campusHub_PDF", bucket);

      const createdDocument = await UnitDocumentModel.create({
        from: currentUser.UserNumber,
        uploadedByName: currentUser.fullName,
        uploadedByRole: currentUser.role,
        assignedProgramme,
        department: assignedDepartment,
        yearOfStudy,
        courseTitle,
        unitName,
        unitCode,
        description,
        originalFileName: req.file.originalname,
        storagePath,
        pdfUrl: pdfUrl,
        status: "active",
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        document: {
          id: createdDocument._id,
          title: createdDocument.originalFileName,
          description: createdDocument.description,
          pdfUrl: createdDocument.pdfUrl,
          unitName: createdDocument.unitName,
          unitCode: createdDocument.unitCode,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to upload document" });
    } finally {
      if (filePath) {
        try {
          await unlink(filePath);
        } catch (cleanupError) {
          console.error("Failed to delete local upload:", cleanupError);
        }
      }
    }
  },
);

export { UnitDocumentUploadRouter };
