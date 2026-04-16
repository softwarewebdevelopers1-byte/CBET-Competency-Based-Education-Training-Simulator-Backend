import mongoose, { type Model } from "mongoose";

interface ProgrammeInterface {
  title: string;
  status: string;
}

const ProgrammeSchema = new mongoose.Schema<ProgrammeInterface>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      default: "active",
      trim: true,
    },
  },
  { timestamps: true },
);

export const Programme =
  (mongoose.models.programme as Model<ProgrammeInterface>) ||
  mongoose.model<ProgrammeInterface>("programme", ProgrammeSchema);
