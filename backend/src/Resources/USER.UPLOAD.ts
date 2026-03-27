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

const generateQuestionsFromPdf = async (
  extractedText: string,
  metadata: {
    courseTitle: string;
    unitName: string;
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
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You generate CBET multiple-choice assessment questions from learning material. Return valid JSON only.",
      },
      {
        role: "user",
        content: `Create ${metadata.questionCount} multiple-choice simulation questions for students.

Course title: ${metadata.courseTitle}
Unit name: ${metadata.unitName}
Unit code: ${metadata.unitCode}

Requirements:
- Return strict JSON with the shape {"questions":[...]} and no markdown.
- Each question must have: prompt, options, correctOptionId, explanation, points.
- Each options array must have exactly 4 items, each with id and text.
- correctOptionId must match one option id.
- Make questions practical and based only on the provided PDF content.
- Keep each explanation short and clear.
- Award 10 points per question.

PDF content:
${trimmedText}`,
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content ?? "";
  const jsonStart = rawContent.indexOf("{");
  const jsonEnd = rawContent.lastIndexOf("}");

  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error("AI response did not contain JSON");
  }

  const parsed = JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1)) as {
    questions?: unknown[];
  };
  const questions = normalizeQuestions(parsed.questions ?? []);

  if (questions.length === 0) {
    throw new Error("Unable to generate valid simulation questions");
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

UserUploadRouter.post(
  "/",
  AuthenticateToken,
  uploads.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const filePath = req.file?.path;

    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ error: "Admin privileges required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Please upload a PDF file" });
        return;
      }

      const courseTitle = String(req.body.courseTitle ?? "").trim();
      const unitName = String(req.body.unitName ?? "").trim();
      const unitCode = String(req.body.unitCode ?? "").trim();
      const assignedProgramme = String(req.body.assignedProgramme ?? "").trim();
      const assignedDepartment = String(
        req.body.assignedDepartment ?? "",
      ).trim();
      const description = String(req.body.description ?? "").trim();
      const instructions = String(req.body.instructions ?? "").trim();
      const questionCount = getQuestionCount(req.body.questionCount);
      const yearOfStudy = Math.max(1, Number(req.body.yearOfStudy) || 1);

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

      const questions = await generateQuestionsFromPdf(parsed.text, {
        courseTitle,
        unitName,
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
        unitName,
        unitCode,
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
        message: "PDF uploaded and simulation generated successfully",
        simulation: {
          id: createdSimulation._id,
          courseTitle: createdSimulation.courseTitle,
          unitName: createdSimulation.unitName,
          unitCode: createdSimulation.unitCode,
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
      if (!currentUser || currentUser.role !== "admin") {
        res.status(403).json({ error: "Admin privileges required" });
        return;
      }

      const simulations = await UsersUploadedPdf.find({})
        .sort({ createdAt: -1 })
        .lean()
        .exec();

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
            uploadedByName: simulation.uploadedByName,
            createdAt: simulation.createdAt,
            updatedAt: simulation.updatedAt,
          };
        }),
      );

      res.status(200).json({ success: true, simulations: response });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to fetch simulations" });
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

      const simulations = await UsersUploadedPdf.find({
        assignedProgramme: currentUser.programme,
        yearOfStudy: currentUser.yearOfStudy ?? 1,
        status: "active",
      })
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
              `AI-generated questions from the uploaded ${simulation.unitName} PDF.`,
            course: `${simulation.courseTitle} - ${simulation.unitCode}`,
            unitName: simulation.unitName,
            unitCode: simulation.unitCode,
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

      res.status(200).json({ success: true, simulations: response });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to fetch student simulations" });
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
        res.status(404).json({ error: "Simulation not found" });
        return;
      }

      const previousAttempt = await StudentSimulationAttempts.findOne({
        simulationId: simulation._id,
        studentUserNumber: currentUser.UserNumber,
      })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      res.status(200).json({
        success: true,
        simulation: {
          id: simulation._id,
          title: `${simulation.unitCode} - ${simulation.unitName}`,
          courseTitle: simulation.courseTitle,
          unitName: simulation.unitName,
          unitCode: simulation.unitCode,
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
            `Apply concepts from ${simulation.unitName}`,
            "Demonstrate understanding of the uploaded PDF material",
            "Earn points by selecting the most accurate answers",
          ],
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
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to load simulation" });
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
        res.status(404).json({ error: "Simulation not found" });
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
      res.status(500).json({ error: "Unable to submit simulation answers" });
    }
  },
);

export { UserUploadRouter };
