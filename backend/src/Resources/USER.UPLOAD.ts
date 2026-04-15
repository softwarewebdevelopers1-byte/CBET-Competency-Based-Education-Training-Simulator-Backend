import { StorageClient } from "@supabase/storage-js";
import { Router, type Request, type Response } from "express";
import { existsSync, mkdirSync } from "fs";
import { readFile, unlink } from "fs/promises";
import multer from "multer";
import path from "path";
import { PDFParse } from "pdf-parse";
import { AuthenticateToken } from "#Verification/access.token";
import {
  StudentSimulationAttempts,
  UsersUploadedPdf,
} from "#models/user.upload.model";
import { User } from "#models/user.model";
import { UnitAssignment } from "#models/unit.assignment.model";
import { Courses } from "#models/courses.model";
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req: Request, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files allowed"));
  },
});

const UserUploadRouter = Router();

const getStorageClient = (): StorageClient => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    throw new Error("Missing Supabase credentials");
  }

  // const normalizedProjectRef = supabaseUrl
  //   .replace(/^https?:\/\//, "")
  //   .replace(/\.supabase\.co.*$/, "");
  const storageUrl = `https://${supabaseUrl}.supabase.co/storage/v1`;

  return new StorageClient(storageUrl, {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  });
};


const normalizeSimulationStatus = (rawStatus: unknown): "active" | "inactive" => {
  return String(rawStatus ?? "").trim().toLowerCase() === "inactive"
    ? "inactive"
    : "active";
};

const normalizeActivityType = (rawType: unknown): "assessment" | "scenario" => {
  return String(rawType ?? "").trim().toLowerCase() === "scenario"
    ? "scenario"
    : "assessment";
};

const canManageUploads = (role: unknown) => {
  const normalizedRole = String(role ?? "").trim().toLowerCase();
  return (
    normalizedRole === "admin" ||
    normalizedRole === "trainer" ||
    normalizedRole === "student"
  );
};

const isAdminUser = (role: unknown) =>
  String(role ?? "").trim().toLowerCase() === "admin";

const isTrainerUser = (role: unknown) =>
  String(role ?? "").trim().toLowerCase() === "trainer";

const buildActivityTypeQuery = (rawType: unknown) => {
  const trimmedType = String(rawType ?? "").trim();
  if (!trimmedType) {
    return null;
  }

  const activityType = normalizeActivityType(trimmedType);

  if (activityType === "assessment") {
    return {
      $or: [
        { activityType: "assessment" },
        { activityType: { $exists: false } },
        { activityType: null },
        { activityType: "" },
      ],
    };
  }

  return { activityType: "scenario" };
};

const deleteSimulationStorageFile = async (storagePath: string) => {
  const trimmedStoragePath = String(storagePath ?? "").trim();
  if (!trimmedStoragePath) {
    return;
  }

  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) {
    throw new Error("bucket name is required");
  }

  const storageClient = getStorageClient();
  const { error } = await storageClient.from(bucket).remove([trimmedStoragePath]);

  if (error) {
    throw new Error(error.message || "Failed to delete PDF from storage");
  }
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

const resolveYearOfStudy = async (params: {
  unitCode: string;
  assignedProgramme: string;
  fallbackYear: number;
}): Promise<number> => {
  const fallbackYear = Math.max(1, params.fallbackYear || 1);
  const normalizedUnitCode = String(params.unitCode ?? "").trim();
  const normalizedProgramme = String(params.assignedProgramme ?? "").trim();

  if (!normalizedUnitCode || !normalizedProgramme) {
    return fallbackYear;
  }

  const matchedCourse = await Courses.findOne({
    unitCode: { $regex: new RegExp(`^${normalizedUnitCode}$`, "i") },
    courseTitle: { $regex: new RegExp(`^${normalizedProgramme}$`, "i") },
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return Math.max(1, Number(matchedCourse?.yearOfStudy) || fallbackYear);
};

const buildSimulationSummary = async (
  simulationId: string,
  totalPoints: number,
) => {
  const [attemptSummary] = await StudentSimulationAttempts.aggregate([
    {
      $match: {
        simulationId:
          UsersUploadedPdf.db.base.Types.ObjectId.createFromHexString(
            simulationId,
          ),
      },
    },
    {
      $group: {
        _id: "$simulationId",
        participants: { $sum: 1 },
        averageScore: { $avg: "$percentage" },
      },
    },
  ]);

  const participants = Number(attemptSummary?.participants ?? 0);
  const averageScore = Math.round(Number(attemptSummary?.averageScore ?? 0));

  return { 
    participants,
    averageScore,
    completion: totalPoints > 0 ? `${averageScore}%` : "0%",
  };
};

const buildAttemptResult = (simulation: any, attempt: any) => {
  if (!simulation || !attempt) {
    return null;
  }

  const feedback = simulation.questions.map((question: any, index: number) => {
    const savedAnswer = attempt.answers.find(
      (answer: any) => answer.questionIndex === index,
    );

    return {
      questionIndex: index,
      prompt: question.prompt,
      isCorrect: savedAnswer?.isCorrect ?? false,
      selectedOptionId: savedAnswer?.selectedOptionId ?? "",
      correctOptionId: question.correctOptionId,
      pointsAwarded: savedAnswer?.pointsAwarded ?? 0,
      explanation: question.explanation,
    };
  });

  return {
    attemptId: attempt._id,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    percentage: attempt.percentage,
    submittedAt: attempt.submittedAt,
    feedback,
  };
};

UserUploadRouter.post(
  "/",
  AuthenticateToken,
  uploads.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const filePath = req.file?.path;

    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !canManageUploads(currentUser.role)) {
        res.status(403).json({ error: "Admin, lecturer, or trainee privileges required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Please upload a PDF file" });
        return;
      }

      const unitCodeInput = String(req.body.unitCode ?? "").trim();
      const unitNameInput = String(req.body.unitName ?? "").trim();
      const activityType = normalizeActivityType(req.body.activityType);
      let assignedProgramme = String(req.body.assignedProgramme ?? "").trim();
      const assignedDepartment = String(
        req.body.assignedDepartment ?? "",
      ).trim();
      const description = String(req.body.description ?? "").trim();
      const instructions = String(req.body.instructions ?? "").trim();
      const fallbackYearOfStudy = Math.max(
        1,
        Number(req.body.yearOfStudy ?? currentUser.yearOfStudy) || 1,
      );
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
      const storagePath = `${assignedProgramme}/${unitCode}/${fileName}`;
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
        .from("campusHub_PDF")
        .getPublicUrl(storagePath);

      const parser = new PDFParse({ url: localFilePath });
      const parsed = await parser.getText();
      await parser.destroy();
      const yearOfStudy = await resolveYearOfStudy({
        unitCode,
        assignedProgramme,
        fallbackYear: fallbackYearOfStudy,
      });

      const createdSimulation = await UsersUploadedPdf.create({
        from: currentUser.UserNumber,
        uploadedByName: currentUser.fullName,
        uploadedByRole: currentUser.role,
        assignedProgramme,
        assignedDepartment,
        yearOfStudy,
        courseTitle,
        unitName,
        unitCode,
        activityType,
        description,
        instructions,
        originalFileName: req.file.originalname,
        storagePath,
        pdfUrl: publicUrlData.publicUrl,
        extractedTextPreview: parsed.text.slice(0, 1200),
        questions: [],
        questionCount: 0,
        totalPoints: 0,
        estimatedTimeMinutes: 0,
        status: "active",
      });

      res.status(201).json({
        success: true,
        message: "PDF uploaded successfully",
        simulation: {
          id: createdSimulation._id,
          courseTitle: createdSimulation.courseTitle,
          unitName: createdSimulation.unitName,
          unitCode: createdSimulation.unitCode,
          activityType: createdSimulation.activityType,
          assignedProgramme: createdSimulation.assignedProgramme,
          pdfUrl: createdSimulation.pdfUrl,
          questionCount: createdSimulation.questionCount,
          totalPoints: createdSimulation.totalPoints,
        },
        assessment: {
          id: createdSimulation._id,
          courseTitle: createdSimulation.courseTitle,
          unitName: createdSimulation.unitName,
          unitCode: createdSimulation.unitCode,
          activityType: createdSimulation.activityType,
          assignedProgramme: createdSimulation.assignedProgramme,
          pdfUrl: createdSimulation.pdfUrl,
          questionCount: createdSimulation.questionCount,
          totalPoints: createdSimulation.totalPoints,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to upload and process PDF" });
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

UserUploadRouter.get(
  "/admin",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !canManageUploads(currentUser.role)) {
        res.status(403).json({ error: "Admin, lecturer, or trainee privileges required" });
        return;
      }

      const activityType = String(req.query?.activityType ?? "").trim();
      const ownership = String(req.query?.ownership ?? "").trim().toLowerCase();
      const managementQuery: Record<string, unknown> = {};

      const activityTypeQuery = buildActivityTypeQuery(activityType);
      if (activityTypeQuery) {
        Object.assign(managementQuery, activityTypeQuery);
      }

      if (!isAdminUser(currentUser.role) || ownership === "self") {
        managementQuery.from = currentUser.UserNumber;
      }

      const simulations = await UsersUploadedPdf.find(managementQuery)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const attemptRecords = await StudentSimulationAttempts.find({
        simulationId: { $in: simulations.map((simulation) => simulation._id) },
      })
        .sort({ submittedAt: -1, createdAt: -1 })
        .lean()
        .exec();

      const participantsBySimulation = new Map<
        string,
        Array<{
          studentName: string;
          studentUserNumber: string;
          score: number;
          totalPoints: number;
          percentage: number;
          submittedAt: Date;
        }>
      >();

      attemptRecords.forEach((attempt) => {
        const key = String(attempt.simulationId);
        const current = participantsBySimulation.get(key) || [];

        if (
          current.some(
            (participant) =>
              participant.studentUserNumber === attempt.studentUserNumber,
          )
        ) {
          return;
        }

        current.push({
          studentName: attempt.studentName,
          studentUserNumber: attempt.studentUserNumber,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          percentage: attempt.percentage,
          submittedAt: attempt.submittedAt,
        });

        participantsBySimulation.set(key, current);
      });

      const response = await Promise.all(
        simulations.map(async (simulation) => {
          const summary = await buildSimulationSummary(
            String(simulation._id),
            simulation.totalPoints,
          );

          return {
            id: simulation._id,
            title: simulation.unitName,
            type: simulation.courseTitle,
            status: simulation.status,
            activityType: simulation.activityType || "assessment",
            unitCode: simulation.unitCode,
            courseTitle: simulation.courseTitle,
            assignedProgramme: simulation.assignedProgramme,
            assignedDepartment: simulation.assignedDepartment,
            yearOfStudy: simulation.yearOfStudy,
            participants: summary.participants,
            averageScore: summary.averageScore,
            completion: summary.completion,
            questionCount: simulation.questionCount,
            totalPoints: simulation.totalPoints,
            pdfUrl: simulation.pdfUrl,
            description: simulation.description,
            instructions: simulation.instructions,
            completedStudents:
              participantsBySimulation.get(String(simulation._id)) || [],
            uploadedByName: simulation.uploadedByName,
            createdAt: simulation.createdAt,
            updatedAt: simulation.updatedAt,
          };
        }),
      );

      res.status(200).json({
        success: true,
        simulations: response,
        assessments: response,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to fetch assessments" });
    }
  },
);

UserUploadRouter.patch(
  "/admin/:id",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !canManageUploads(currentUser.role)) {
        res.status(403).json({ error: "Admin, lecturer, or trainee privileges required" });
        return;
      }

      const ownershipQuery = isAdminUser(currentUser.role)
        ? {}
        : { from: currentUser.UserNumber };
      const simulation = await UsersUploadedPdf.findOne({
        _id: req.params.id,
        ...ownershipQuery,
      })
        .lean()
        .exec();

      if (!simulation) {
        res.status(404).json({ error: "Uploaded material not found" });
        return;
      }

      const updates: Record<string, unknown> = {};
      const courseTitle = String(req.body?.courseTitle ?? "").trim();
      const unitName = String(req.body?.unitName ?? "").trim();
      const unitCode = String(req.body?.unitCode ?? "").trim();
      const description = String(req.body?.description ?? "").trim();
      const instructions = String(req.body?.instructions ?? "").trim();
      const assignedProgramme = String(req.body?.assignedProgramme ?? "").trim();
      const assignedDepartment = String(req.body?.assignedDepartment ?? "").trim();
      const activityTypeInput = String(req.body?.activityType ?? "").trim();

      if (courseTitle) updates.courseTitle = courseTitle;
      if (unitName) updates.unitName = unitName;
      if (unitCode) updates.unitCode = unitCode;
      if (description || req.body?.description === "") updates.description = description;
      if (instructions || req.body?.instructions === "") updates.instructions = instructions;
      if (assignedProgramme) updates.assignedProgramme = assignedProgramme;
      if (assignedDepartment || req.body?.assignedDepartment === "") {
        updates.assignedDepartment = assignedDepartment;
      }
      if (activityTypeInput) {
        updates.activityType = normalizeActivityType(activityTypeInput);
      }

      const nextUnitCode = String(updates.unitCode ?? simulation.unitCode);
      const nextProgramme = String(
        updates.assignedProgramme ?? simulation.assignedProgramme,
      );
      updates.yearOfStudy = await resolveYearOfStudy({
        unitCode: nextUnitCode,
        assignedProgramme: nextProgramme,
        fallbackYear: simulation.yearOfStudy ?? currentUser.yearOfStudy ?? 1,
      });

      const updatedSimulation = await UsersUploadedPdf.findOneAndUpdate(
        { _id: req.params.id, ...ownershipQuery },
        { $set: updates },
        { new: true, runValidators: true },
      )
        .lean()
        .exec();

      if (!updatedSimulation) {
        res.status(404).json({ error: "Uploaded material not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Uploaded material updated successfully",
        simulation: updatedSimulation,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to update uploaded material" });
    }
  },
);

UserUploadRouter.patch(
  "/admin/:id/status",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !canManageUploads(currentUser.role)) {
        res.status(403).json({ error: "Admin, lecturer, or trainee privileges required" });
        return;
      }

      const status = normalizeSimulationStatus(req.body?.status);
      const ownershipQuery = isAdminUser(currentUser.role)
        ? {}
        : { from: currentUser.UserNumber };

      const updatedSimulation = await UsersUploadedPdf.findOneAndUpdate(
        { _id: req.params.id, ...ownershipQuery },
        {
          $set: { status },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .lean()
        .exec();

      if (!updatedSimulation) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Simulation ${status === "active" ? "activated" : "deactivated"} successfully`,
        simulation: {
          id: updatedSimulation._id,
          status: updatedSimulation.status,
          updatedAt: updatedSimulation.updatedAt,
        },
        assessment: {
          id: updatedSimulation._id,
          status: updatedSimulation.status,
          updatedAt: updatedSimulation.updatedAt,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to update assessment status" });
    }
  },
);

UserUploadRouter.delete(
  "/admin/:id",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !canManageUploads(currentUser.role)) {
        res.status(403).json({ error: "Admin, lecturer, or trainee privileges required" });
        return;
      }

      const ownershipQuery = isAdminUser(currentUser.role)
        ? {}
        : { from: currentUser.UserNumber };

      const simulation = await UsersUploadedPdf.findOne({
        _id: req.params.id,
        ...ownershipQuery,
      })
        .lean()
        .exec();

      if (!simulation) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      await deleteSimulationStorageFile(simulation.storagePath);
      await StudentSimulationAttempts.deleteMany({
        simulationId: simulation._id,
      }).exec();
      await UsersUploadedPdf.deleteOne({ _id: simulation._id }).exec();

      res.status(200).json({
        success: true,
        message: "Assessment and all related records deleted successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to delete assessment" });
    }
  },
);

UserUploadRouter.get(
  "/student",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== "student") {
        res.status(403).json({ error: "Student access required" });
        return;
      }

      const activityType = String(req.query?.activityType ?? "").trim();
      const studentQuery: Record<string, unknown> = {
        assignedProgramme: currentUser.programme,
        yearOfStudy: currentUser.yearOfStudy ?? 1,
        status: "active",
      };

      const activityTypeQuery = buildActivityTypeQuery(activityType);
      if (activityTypeQuery) {
        Object.assign(studentQuery, activityTypeQuery);
      }

      const simulations = await UsersUploadedPdf.find(studentQuery)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const attemptRecords = await StudentSimulationAttempts.find({
        studentUserNumber: currentUser.UserNumber,
        simulationId: { $in: simulations.map((simulation) => simulation._id) },
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const latestAttemptBySimulation = new Map<
        string,
        (typeof attemptRecords)[number]
      >();
      attemptRecords.forEach((attempt) => {
        const key = String(attempt.simulationId);
        if (!latestAttemptBySimulation.has(key)) {
          latestAttemptBySimulation.set(key, attempt);
        }
      });

      const response = await Promise.all(
        simulations.map(async (simulation) => {
          const latestAttempt = latestAttemptBySimulation.get(
            String(simulation._id),
          );
          const summary = await buildSimulationSummary(
            String(simulation._id),
            simulation.totalPoints,
          );

          return {
            id: simulation._id,
            title: `${simulation.unitCode} - ${simulation.unitName}`,
            description:
              simulation.description ||
              `Uploaded learning material for ${simulation.unitName}.`,
            course: `${simulation.courseTitle} - ${simulation.unitCode}`,
            unitName: simulation.unitName,
            unitCode: simulation.unitCode,
            activityType: simulation.activityType || "assessment",
            questionCount: simulation.questionCount,
            totalPoints: simulation.totalPoints,
            estimatedTimeMinutes: simulation.estimatedTimeMinutes,
            instructions: simulation.instructions,
            pdfUrl: simulation.pdfUrl,
            aiGenerated: simulation.questionCount > 0,
            status: latestAttempt ? "completed" : "pending",
            score: latestAttempt?.score ?? null,
            percentage: latestAttempt?.percentage ?? null,
            completedDate: latestAttempt?.submittedAt ?? null,
            participants: summary.participants,
            averageScore: summary.averageScore,
            createdAt: simulation.createdAt,
          };
        }),
      );

      res.status(200).json({
        success: true,
        simulations: response,
        assessments: response,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to fetch student assessments" });
    }
  },
);

UserUploadRouter.get(
  "/student/portfolio",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== "student") {
        res.status(403).json({ error: "Student access required" });
        return;
      }

      const attempts = await StudentSimulationAttempts.find({
        studentUserNumber: currentUser.UserNumber,
      })
        .sort({ submittedAt: -1, createdAt: -1 })
        .lean()
        .exec();

      const latestAttemptBySimulation = new Map<
        string,
        (typeof attempts)[number]
      >();

      attempts.forEach((attempt) => {
        const key = String(attempt.simulationId);
        if (!latestAttemptBySimulation.has(key)) {
          latestAttemptBySimulation.set(key, attempt);
        }
      });

      const simulationIds = Array.from(latestAttemptBySimulation.keys()).map((id) =>
        UsersUploadedPdf.db.base.Types.ObjectId.createFromHexString(id),
      );

      const simulations = simulationIds.length
        ? await UsersUploadedPdf.find({
            _id: { $in: simulationIds },
            assignedProgramme: currentUser.programme,
            yearOfStudy: currentUser.yearOfStudy ?? 1,
          })
            .lean()
            .exec()
        : [];

      const portfolioItems = simulations.map((simulation) => {
        const attempt = latestAttemptBySimulation.get(String(simulation._id));
        const percentage = Number(attempt?.percentage ?? 0);
        const score = Number(attempt?.score ?? 0);
        const totalPoints = Number(simulation.totalPoints ?? attempt?.totalPoints ?? 0);
        const isApproved = percentage >= 50;
        const badgeCandidates = [];

        if (percentage >= 90) {
          badgeCandidates.push("Distinction");
        }
        if (score === totalPoints && totalPoints > 0) {
          badgeCandidates.push("Perfect Score");
        }
        if (simulation.questionCount >= 10) {
          badgeCandidates.push("Advanced Simulation");
        }

        return {
          id: String(attempt?._id ?? simulation._id),
          simulationId: String(simulation._id),
          title: `${simulation.unitCode} - ${simulation.unitName}`,
          type: "simulation",
          category: "project",
          description:
            simulation.description ||
            `Completed AI simulation for ${simulation.courseTitle}.`,
          thumbnail: "AI",
          date: attempt?.submittedAt ?? simulation.createdAt,
          status: isApproved ? "approved" : "pending",
          visibility: "private",
          skills: [
            simulation.courseTitle,
            simulation.unitCode,
            simulation.assignedProgramme,
            `${simulation.questionCount} Questions`,
          ].filter(Boolean),
          images: 0,
          documents: 1,
          videos: 0,
          feedback: [
            {
              from: "CBET Simulation Engine",
              comment: `Scored ${score}/${totalPoints} (${percentage}%) in this simulation.`,
              rating: Math.max(1, Math.min(5, Math.round(percentage / 20) || 1)),
              date: attempt?.submittedAt ?? simulation.updatedAt ?? simulation.createdAt,
            },
          ],
          verifications: [
            {
              verifier: simulation.uploadedByName || "System",
              date: attempt?.submittedAt ?? simulation.updatedAt ?? simulation.createdAt,
              status: "verified",
            },
          ],
          grade:
            percentage >= 80
              ? "A"
              : percentage >= 70
                ? "B"
                : percentage >= 60
                  ? "C"
                  : percentage >= 50
                    ? "Pass"
                    : "Needs Improvement",
          points: score,
          badges: badgeCandidates,
          score,
          totalPoints,
          percentage,
          unitCode: simulation.unitCode,
          courseTitle: simulation.courseTitle,
        };
      });

      res.status(200).json({
        success: true,
        student: {
          fullName: currentUser.fullName,
          userNumber: currentUser.UserNumber,
          programme: currentUser.programme,
          department: currentUser.department ?? "",
          yearOfStudy: currentUser.yearOfStudy ?? 1,
        },
        portfolioItems,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to load portfolio data" });
    }
  },
);

UserUploadRouter.get(
  "/student/:id",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== "student") {
        res.status(403).json({ error: "Student access required" });
        return;
      }

      const simulation = await UsersUploadedPdf.findOne({
        _id: req.params.id,
        assignedProgramme: currentUser.programme,
        yearOfStudy: currentUser.yearOfStudy ?? 1,
        status: "active",
      })
        .lean()
        .exec();

      if (!simulation) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      if (!Array.isArray(simulation.questions) || simulation.questions.length === 0) {
        res.status(400).json({
          error: "This uploaded PDF is material-only and has no assessment questions.",
        });
        return;
      }

      const previousAttempt = await StudentSimulationAttempts.findOne({
        simulationId: simulation._id,
        studentUserNumber: currentUser.UserNumber,
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const previousResult = buildAttemptResult(simulation, previousAttempt);

      const assessmentPayload = {
          id: simulation._id,
          title: `${simulation.unitCode} - ${simulation.unitName}`,
          courseTitle: simulation.courseTitle,
          unitName: simulation.unitName,
          unitCode: simulation.unitCode,
          activityType: simulation.activityType || "assessment",
          description:
            simulation.description ||
            "Review the uploaded PDF material and instructions.",
          instructions:
            simulation.instructions ||
            "Read every question carefully and choose the best answer.",
          totalPoints: simulation.totalPoints,
          estimatedTimeMinutes: simulation.estimatedTimeMinutes,
          questionCount: simulation.questionCount,
          pdfUrl: simulation.pdfUrl,
          learningObjectives: [
            `Apply concepts from ${simulation.unitName}`,
            "Demonstrate understanding of the uploaded PDF material",
            "Earn points by selecting the most accurate answers",
          ],
          isCompleted: Boolean(previousAttempt),
          questions: simulation.questions.map((question, index) => ({
            id: `question-${index + 1}`,
            prompt: question.prompt,
            points: question.points,
            options: question.options,
          })),
          previousAttempt: previousAttempt
            ? {
                score: previousAttempt.score,
                percentage: previousAttempt.percentage,
                submittedAt: previousAttempt.submittedAt,
              }
            : null,
          previousResult,
        };

      res.status(200).json({
        success: true,
        simulation: assessmentPayload,
        assessment: assessmentPayload,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to load assessment" });
    }
  },
);

UserUploadRouter.post(
  "/student/:id/submit",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== "student") {
        res.status(403).json({ error: "Student access required" });
        return;
      }

      const simulation = await UsersUploadedPdf.findOne({
        _id: req.params.id,
        assignedProgramme: currentUser.programme,
        yearOfStudy: currentUser.yearOfStudy ?? 1,
        status: "active",
      })
        .lean()
        .exec();

      if (!simulation) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      if (!Array.isArray(simulation.questions) || simulation.questions.length === 0) {
        res.status(400).json({
          error: "This uploaded PDF is material-only and has no assessment questions.",
        });
        return;
      }

      const existingAttempt = await StudentSimulationAttempts.findOne({
        simulationId: simulation._id,
        studentUserNumber: currentUser.UserNumber,
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (existingAttempt) {
        res.status(409).json({
          error: "You have already completed this assessment.",
          result: buildAttemptResult(simulation, existingAttempt),
        });
        return;
      }

      const rawAnswers = Array.isArray(req.body?.answers)
        ? req.body.answers
        : [];
      if (rawAnswers.length === 0) {
        res.status(400).json({ error: "At least one answer is required" });
        return;
      }

      const normalizedAnswers = simulation.questions.map((question, index) => {
        const submittedAnswer = rawAnswers.find(
          (answer: Record<string, unknown>) =>
            Number(answer.questionIndex) === index,
        ) as Record<string, unknown> | undefined;

        const selectedOptionId = String(submittedAnswer?.selectedOptionId ?? "")
          .trim()
          .toLowerCase();
        const isCorrect = selectedOptionId === question.correctOptionId;

        return {
          questionIndex: index,
          selectedOptionId,
          isCorrect,
          pointsAwarded: isCorrect ? question.points : 0,
          explanation: question.explanation,
          prompt: question.prompt,
          correctOptionId: question.correctOptionId,
        };
      });

      const score = normalizedAnswers.reduce(
        (sum, answer) => sum + answer.pointsAwarded,
        0,
      );
      const percentage = Math.round((score / simulation.totalPoints) * 100);

      const createdAttempt = await StudentSimulationAttempts.create({
        simulationId: simulation._id,
        studentUserNumber: currentUser.UserNumber,
        studentName: currentUser.fullName,
        answers: normalizedAnswers.map((answer) => ({
          questionIndex: answer.questionIndex,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
          pointsAwarded: answer.pointsAwarded,
        })),
        score,
        totalPoints: simulation.totalPoints,
        percentage,
        submittedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        result: {
          attemptId: createdAttempt._id,
          score,
          totalPoints: simulation.totalPoints,
          percentage,
          feedback: normalizedAnswers.map((answer) => ({
            questionIndex: answer.questionIndex,
            prompt: answer.prompt,
            isCorrect: answer.isCorrect,
            selectedOptionId: answer.selectedOptionId,
            correctOptionId: answer.correctOptionId,
            pointsAwarded: answer.pointsAwarded,
            explanation: answer.explanation,
          })),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to submit assessment answers" });
    }
  },
);

export { UserUploadRouter };
