import { StorageClient } from "@supabase/storage-js";
import { Router, type Request, type Response } from "express";
import { existsSync, mkdirSync } from "fs";
import { readFile, unlink } from "fs/promises";
import multer from "multer";
import path from "path";
import { PDFParse } from "pdf-parse";
import { Groq } from "groq-sdk/index.mjs";
import { AuthenticateToken } from "#Verification/access.token";
import {
  StudentSimulationAttempts,
  UsersUploadedPdf,
} from "#models/user.upload.model";
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

type GeneratedQuestion = {
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
  points: number;
};

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

const getQuestionCount = (rawQuestionCount: unknown): number => {
  const parsedValue = Number(rawQuestionCount);
  if (!Number.isFinite(parsedValue)) {
    return 8;
  }
  return Math.min(12, Math.max(3, Math.floor(parsedValue)));
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

const normalizeQuestions = (rawQuestions: unknown[]): GeneratedQuestion[] => {
  return rawQuestions
    .map((question, index) => {
      const raw = (question ?? {}) as Record<string, unknown>;
      const rawOptions = Array.isArray(raw.options) ? raw.options : [];
      const options = rawOptions
        .map((option, optionIndex) => {
          const optionValue = option as Record<string, unknown>;
          const text = String(optionValue.text ?? "").trim();
          const fallbackId = String.fromCharCode(
            65 + optionIndex,
          ).toLowerCase();
          const id = String(optionValue.id ?? fallbackId)
            .trim()
            .toLowerCase();

          if (!text) {
            return null;
          }

          return { id, text };
        })
        .filter(Boolean) as Array<{ id: string; text: string }>;

      const correctOptionId = String(raw.correctOptionId ?? "")
        .trim()
        .toLowerCase();

      if (
        !String(raw.prompt ?? "").trim() ||
        options.length < 2 ||
        !correctOptionId ||
        !options.some((option) => option.id === correctOptionId)
      ) {
        return null;
      }

      return {
        prompt: String(raw.prompt).trim(),
        options,
        correctOptionId,
        explanation:
          String(raw.explanation ?? "").trim() ||
          "Review the source PDF and core concept for the correct answer.",
        points: Math.max(5, Number(raw.points) || 10),
      };
    })
    .filter(Boolean) as GeneratedQuestion[];
};

const getAssessmentUnitSubtitle = (
  simulation: { unitSubtitle?: unknown; unitName?: unknown } | null | undefined,
) => {
  return String(simulation?.unitSubtitle ?? simulation?.unitName ?? "").trim();
};

const generateQuestionsFromPdf = async (
  extractedText: string,
  metadata: {
    courseTitle: string;
    unitSubtitle: string;
    unitCode: string;
    questionCount: number;
  },
): Promise<GeneratedQuestion[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const groq = new Groq({ apiKey });
  const trimmedText = extractedText.slice(0, 18000);

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0.3, // Lower temperature for more consistent formatting
    response_format: { type: "json_object" }, // Request JSON format if supported
    messages: [
      {
        role: "system",
        content:
          "You are a JSON generator that creates CBET multiple-choice assessment questions. You MUST return valid, parseable JSON only. Do not include markdown, code blocks, or any text outside the JSON structure.",
      },
      {
        role: "user",
        content: `Create ${metadata.questionCount} multiple-choice simulation questions for students.

Course title: ${metadata.courseTitle}
Unit subtitle: ${metadata.unitSubtitle}
Unit code: ${metadata.unitCode}

Requirements:
- Return strict JSON with the shape {"questions": [...]} and no markdown, no backticks, no extra text.
- Each question must have: prompt, options, correctOptionId, explanation, points.
- Each options array must have exactly 4 items, each with id and text.
- Use 'a', 'b', 'c', 'd' as option ids.
- correctOptionId must match one option id (e.g., 'a', 'b', 'c', or 'd').
- Make questions practical and based only on the provided PDF content.
- Keep each explanation short and clear.
- Award 10 points per question.

Example format:
{
  "questions": [
    {
      "prompt": "What is the primary purpose of...?",
      "options": [
        {"id": "a", "text": "Option 1"},
        {"id": "b", "text": "Option 2"},
        {"id": "c", "text": "Option 3"},
        {"id": "d", "text": "Option 4"}
      ],
      "correctOptionId": "b",
      "explanation": "The correct answer is B because...",
      "points": 10
    }
  ]
}

PDF content:
${trimmedText}`,
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content ?? "";
  
  // Sanitize the response
  let sanitizedContent = rawContent.trim();
  
  // Remove markdown code blocks
  sanitizedContent = sanitizedContent.replace(/```json\n?/g, '');
  sanitizedContent = sanitizedContent.replace(/```\n?/g, '');
  sanitizedContent = sanitizedContent.replace(/`/g, '');
  
  // Find JSON object in the response
  const jsonStart = sanitizedContent.indexOf("{");
  const jsonEnd = sanitizedContent.lastIndexOf("}");
  
  if (jsonStart < 0 || jsonEnd < 0) {
    console.error("AI Response (no JSON found):", sanitizedContent.substring(0, 500));
    throw new Error("AI response did not contain JSON");
  }
  
  let jsonString = sanitizedContent.slice(jsonStart, jsonEnd + 1);
  
  // Attempt to fix common JSON issues
  jsonString = jsonString
    // Fix trailing commas
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    // Fix missing quotes around property names
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
    // Remove comments if any
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  
  let parsed;
  try {
    parsed = JSON.parse(jsonString) as { questions?: unknown[] };
  } catch (parseError:any) {
    console.error("JSON Parse Error:", parseError.message);
    console.error("Problematic JSON string:", jsonString.substring(0, 1000));
    console.error("Error position around 701:", jsonString.substring(690, 710));
    
    // Try one more time with aggressive cleaning
    const cleanedJsonString = jsonString
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    
    try {
      parsed = JSON.parse(cleanedJsonString) as { questions?: unknown[] };
    } catch (finalError) {
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
    }
  }
  
  // Validate and normalize the questions
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("AI response missing 'questions' array");
  }
  
  const questions = normalizeQuestions(parsed.questions);
  
  if (questions.length === 0) {
    throw new Error("Unable to generate valid simulation questions");
  }
  
  // Ensure we have the requested number of questions
  if (questions.length < metadata.questionCount) {
    console.warn(`Generated only ${questions.length} out of ${metadata.questionCount} requested questions`);
  }
  
  return questions;
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
  unitSubtitleInput: string,
) => {
  const normalizedUnitCode = String(unitCodeInput ?? "").trim();
  const normalizedUnitSubtitle = String(unitSubtitleInput ?? "").trim();

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
  } else if (normalizedUnitSubtitle) {
    assignmentFilters.unitName = {
      $regex: new RegExp(`^${normalizedUnitSubtitle}$`, "i"),
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
      const unitSubtitleInput = String(req.body.unitSubtitle ?? "").trim();
      const activityType = normalizeActivityType(req.body.activityType);
      let assignedProgramme = String(req.body.assignedProgramme ?? "").trim();
      const assignedDepartment = String(
        req.body.assignedDepartment ?? "",
      ).trim();
      const description = String(req.body.description ?? "").trim();
      const instructions = String(req.body.instructions ?? "").trim();
      const questionCount = getQuestionCount(req.body.questionCount);
      const yearOfStudy = Math.max(1, Number(req.body.yearOfStudy) || 1);
      const assignment = await getAssignedUnitForUploader(
        currentUser,
        unitCodeInput,
        unitSubtitleInput,
      );

      if (!isAdminUser(currentUser.role) && !assignment) {
        res.status(403).json({
          error:
            "You can only upload documents for units assigned to you. Provide assigned unit code or unit name.",
        });
        return;
      }

      const unitCode = assignment?.unitCode ?? unitCodeInput;
      const unitSubtitle = assignment?.unitName ?? unitSubtitleInput;
      const courseTitleInput = String(req.body.courseTitle ?? "").trim();
      const courseTitle = assignment?.courseTitle ?? courseTitleInput;

      if (!assignedProgramme) {
        assignedProgramme = assignment?.courseTitle ?? courseTitle;
      }

      if (!courseTitle || !unitSubtitle || !unitCode || !assignedProgramme) {
        res.status(400).json({
          error:
            "courseTitle, unitSubtitle, unitCode, and assignedProgramme are required",
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

      const questions = await generateQuestionsFromPdf(parsed.text, {
        courseTitle,
        unitSubtitle,
        unitCode,
        questionCount,
      });
      const totalPoints = questions.reduce(
        (sum, question) => sum + question.points,
        0,
      );

      const createdSimulation = await UsersUploadedPdf.create({
        from: currentUser.UserNumber,
        uploadedByName: currentUser.fullName,
        uploadedByRole: currentUser.role,
        assignedProgramme,
        assignedDepartment,
        yearOfStudy,
        courseTitle,
        unitSubtitle,
        unitCode,
        activityType,
        description,
        instructions,
        originalFileName: req.file.originalname,
        storagePath,
        pdfUrl: publicUrlData.publicUrl,
        extractedTextPreview: parsed.text.slice(0, 1200),
        questions,
        questionCount: questions.length,
        totalPoints,
        estimatedTimeMinutes: Math.max(10, questions.length * 2),
        status: "active",
      });

      res.status(201).json({
        success: true,
        message: "PDF uploaded and assessment generated successfully",
        simulation: {
          id: createdSimulation._id,
          courseTitle: createdSimulation.courseTitle,
          unitSubtitle: createdSimulation.unitSubtitle,
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
          unitSubtitle: createdSimulation.unitSubtitle,
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
          const unitSubtitle = getAssessmentUnitSubtitle(simulation);
          const summary = await buildSimulationSummary(
            String(simulation._id),
            simulation.totalPoints,
          );

          return {
            id: simulation._id,
            title: unitSubtitle,
            type: simulation.courseTitle,
            status: simulation.status,
            activityType: simulation.activityType || "assessment",
            unitCode: simulation.unitCode,
            courseTitle: simulation.courseTitle,
            unitSubtitle,
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
          const unitSubtitle = getAssessmentUnitSubtitle(simulation);
          const latestAttempt = latestAttemptBySimulation.get(
            String(simulation._id),
          );
          const summary = await buildSimulationSummary(
            String(simulation._id),
            simulation.totalPoints,
          );

          return {
            id: simulation._id,
            title: `${simulation.unitCode} - ${unitSubtitle}`,
            description:
              simulation.description ||
              `AI-generated questions from the uploaded ${unitSubtitle} PDF.`,
            course: `${simulation.courseTitle} - ${simulation.unitCode}`,
            unitSubtitle,
            unitCode: simulation.unitCode,
            activityType: simulation.activityType || "assessment",
            questionCount: simulation.questionCount,
            totalPoints: simulation.totalPoints,
            estimatedTimeMinutes: simulation.estimatedTimeMinutes,
            instructions: simulation.instructions,
            pdfUrl: simulation.pdfUrl,
            aiGenerated: true,
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
        const unitSubtitle = getAssessmentUnitSubtitle(simulation);
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
          title: `${simulation.unitCode} - ${unitSubtitle}`,
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
          unitSubtitle,
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

      const previousAttempt = await StudentSimulationAttempts.findOne({
        simulationId: simulation._id,
        studentUserNumber: currentUser.UserNumber,
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const previousResult = buildAttemptResult(simulation, previousAttempt);
      const unitSubtitle = getAssessmentUnitSubtitle(simulation);

      const assessmentPayload = {
          id: simulation._id,
          title: `${simulation.unitCode} - ${unitSubtitle}`,
          courseTitle: simulation.courseTitle,
          unitSubtitle,
          unitCode: simulation.unitCode,
          activityType: simulation.activityType || "assessment",
          description:
            simulation.description ||
            "Answer the AI-generated questions based on the uploaded PDF.",
          instructions:
            simulation.instructions ||
            "Read every question carefully and choose the best answer.",
          totalPoints: simulation.totalPoints,
          estimatedTimeMinutes: simulation.estimatedTimeMinutes,
          questionCount: simulation.questionCount,
          pdfUrl: simulation.pdfUrl,
          learningObjectives: [
            `Apply concepts from ${unitSubtitle}`,
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

UserUploadRouter.delete(
  "/:id",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userNumber =
        String(
          (req.user as { userNumber?: string } | undefined)?.userNumber ?? "",
        ).trim() || String(req.cookies?.user_1UA_XG ?? "").trim();

      const currentUser = await User.findOne({ UserNumber: userNumber }).lean().exec();
      if (!currentUser) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const isAdmin = String(currentUser.role).trim().toLowerCase() === "admin";
      const isTrainer = String(currentUser.role).trim().toLowerCase() === "trainer";

      if (!isAdmin && !isTrainer) {
        res.status(403).json({ error: "Admin or lecturer privileges required" });
        return;
      }

      const documentId = req.params.id;
      const document = await UsersUploadedPdf.findById(documentId).lean().exec();

      if (!document) {
        res.status(404).json({ error: "Assessment not found" });
        return;
      }

      let canDelete = isAdmin;
      if (!canDelete && isTrainer) {
        if (document.from === currentUser.UserNumber) {
          canDelete = true;
        } else {
           const assignment = await UnitAssignment.findOne({
               unitCode: document.unitCode,
               assigneeUserNumber: currentUser.UserNumber,
               assignmentType: "lecturer"
           }).lean().exec();
           if (assignment) canDelete = true;
        }
      }

      if (!canDelete) {
        res.status(403).json({ error: "You don't have permission to delete this assessment" });
        return;
      }

      if (document.storagePath) {
        try {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const supabaseUrl = process.env.SUPABASE_URL;
          if (serviceKey && supabaseUrl) {
            const storageUrl = `https://${supabaseUrl}.supabase.co/storage/v1`;
            const storageClient = new StorageClient(storageUrl, {
               apikey: serviceKey,
               Authorization: `Bearer ${serviceKey}`,
            });
            const bucket = process.env.SUPABASE_BUCKET;
            if (bucket) {
               await storageClient.from(bucket).remove([document.storagePath]);
            }
          }
        } catch (storageError) {
          console.error("Failed to delete assessment from storage:", storageError);
        }
      }

      try {
         await StudentSimulationAttempts.deleteMany({ simulationId: document._id }).exec();
      } catch(e) {}

      await UsersUploadedPdf.findByIdAndDelete(documentId).exec();

      res.status(200).json({ success: true, message: "Assessment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export { UserUploadRouter };
