import mongoose, { type Model } from "mongoose";

interface RegisteredCourseInterface {
  unitId: mongoose.Types.ObjectId;
  courseTitle: string;
  unitCode: string;
  unitName: string;
  studentUserNumber: string;
  studentName: string;
  programme: string;
  department?: string;
  yearOfStudy: number;
  status: string;
  registeredAt?: Date;
}

const RegisteredCourseSchema = new mongoose.Schema<RegisteredCourseInterface>({
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "courses",
    required: true,
    index: true,
  },
  courseTitle: {
    type: String,
    required: true,
    trim: true,
  },
  unitCode: {
    type: String,
    required: true,
    trim: true,
  },
  unitName: {
    type: String,
    required: true,
    trim: true,
  },
  studentUserNumber: {
    type: String,
    required: true,
    trim: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  programme: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    default: "",
    trim: true,
  },
  yearOfStudy: {
    type: Number,
    required: true,
    default: 1,
  },
  status: {
    type: String,
    default: "registered",
    trim: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

RegisteredCourseSchema.index(
  { unitId: 1, studentUserNumber: 1 },
  { unique: true },
);

export const RegisteredCourse =
  (mongoose.models.registredCourses as Model<RegisteredCourseInterface>) ||
  mongoose.model<RegisteredCourseInterface>(
    "registredCourses",
    RegisteredCourseSchema,
  );
