import mongoose, { type Model } from "mongoose";

interface UnitAssignmentInterface {
  unitId: mongoose.Types.ObjectId;
  courseTitle: string;
  unitCode: string;
  unitName: string;
  assignmentType: "lecturer" | "trainee";
  assigneeUserNumber: string;
  assigneeName: string;
  assigneeRole: "trainer" | "student";
  assignedByUserNumber: string;
  assignedAt?: Date;
}

const UnitAssignmentSchema = new mongoose.Schema<UnitAssignmentInterface>({
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
  assignmentType: {
    type: String,
    enum: ["lecturer", "trainee"],
    required: true,
  },
  assigneeUserNumber: {
    type: String,
    required: true,
    trim: true,
  },
  assigneeName: {
    type: String,
    required: true,
    trim: true,
  },
  assigneeRole: {
    type: String,
    enum: ["trainer", "student"],
    required: true,
  },
  assignedByUserNumber: {
    type: String,
    required: true,
    trim: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});

UnitAssignmentSchema.index(
  { unitId: 1, assignmentType: 1, assigneeUserNumber: 1 },
  { unique: true },
);

export const UnitAssignment =
  (mongoose.models.unit_assignment as Model<UnitAssignmentInterface>) ||
  mongoose.model<UnitAssignmentInterface>(
    "unit_assignment",
    UnitAssignmentSchema,
  );
