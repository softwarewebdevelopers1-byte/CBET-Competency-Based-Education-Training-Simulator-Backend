import mongoose, { Model, type InferSchemaType } from "mongoose";

const questionOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true, trim: true },
    options: {
      type: [questionOptionSchema],
      default: [],
      validate: {
        validator(value: Array<{ id: string; text: string }>) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "Each question must include at least two options",
      },
    },
    correctOptionId: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    points: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const UserUploadSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, trim: true },
    uploadedByName: { type: String, required: true, trim: true },
    uploadedByRole: { type: String, default: "admin", trim: true },
    assignedProgramme: { type: String, required: true, trim: true },
    assignedDepartment: { type: String, default: "", trim: true },
    yearOfStudy: { type: Number, default: 1, min: 1 },
    courseTitle: { type: String, required: true, trim: true },
    unitName: { type: String, required: true, trim: true },
    unitCode: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    instructions: { type: String, default: "", trim: true },
    originalFileName: { type: String, required: true, trim: true },
    storagePath: { type: String, required: true, trim: true },
    pdfUrl: { type: String, required: true, trim: true },
    extractedTextPreview: { type: String, default: "", trim: true },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator(value: unknown[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Simulation must include at least one AI-generated question",
      },
    },
    questionCount: { type: Number, required: true, min: 1 },
    totalPoints: { type: Number, required: true, min: 1 },
    estimatedTimeMinutes: { type: Number, default: 15, min: 1 },
    status: { type: String, default: "active", trim: true },
  },
  { timestamps: true },
);

UserUploadSchema.index({
  assignedProgramme: 1,
  yearOfStudy: 1,
  unitCode: 1,
  status: 1,
});

const StudentSimulationAttemptSchema = new mongoose.Schema(
  {
    simulationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users_pdf",
      required: true,
      index: true,
    },
    studentUserNumber: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, required: true, trim: true },
    answers: {
      type: [
        new mongoose.Schema(
          {
            questionIndex: { type: Number, required: true, min: 0 },
            selectedOptionId: { type: String, required: true, trim: true },
            isCorrect: { type: Boolean, required: true },
            pointsAwarded: { type: Number, required: true, min: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    score: { type: Number, required: true, min: 0 },
    totalPoints: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

StudentSimulationAttemptSchema.index({
  simulationId: 1,
  studentUserNumber: 1,
  createdAt: -1,
});

type UsersUploads = InferSchemaType<typeof UserUploadSchema>;
type StudentSimulationAttempt = InferSchemaType<
  typeof StudentSimulationAttemptSchema
>;

const UsersUploadedPdf =
  (mongoose.models.pdf as Model<UsersUploads>) ||
  mongoose.model<UsersUploads>("users_pdf", UserUploadSchema);

const StudentSimulationAttempts =
  (mongoose.models.student_simulation_attempt as Model<StudentSimulationAttempt>) ||
  mongoose.model<StudentSimulationAttempt>(
    "student_simulation_attempt",
    StudentSimulationAttemptSchema,
  );

export { UsersUploadedPdf, StudentSimulationAttempts };
