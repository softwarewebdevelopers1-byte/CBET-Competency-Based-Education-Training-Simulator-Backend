import mongoose, { Model, type InferSchemaType } from "mongoose";

const UnitDocumentSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, trim: true },
    uploadedByName: { type: String, required: true, trim: true },
    uploadedByRole: { type: String, default: "trainer", trim: true },
    assignedProgramme: { type: String, required: true, trim: true },
    department: { type: String, default: "", trim: true },
    yearOfStudy: { type: Number, default: 1, min: 1 },
    courseTitle: { type: String, required: true, trim: true },
    unitName: { type: String, required: true, trim: true },
    unitCode: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    originalFileName: { type: String, required: true, trim: true },
    storagePath: { type: String, required: true, trim: true },
    pdfUrl: { type: String, required: true, trim: true },
    status: { type: String, default: "active", trim: true },
  },
  { timestamps: true },
);

UnitDocumentSchema.index({
  assignedProgramme: 1,
  yearOfStudy: 1,
  unitCode: 1,
  status: 1,
});

type UnitDocumentType = InferSchemaType<typeof UnitDocumentSchema>;

const UnitDocumentModel =
  (mongoose.models.unit_document as Model<UnitDocumentType>) ||
  mongoose.model<UnitDocumentType>("unit_document", UnitDocumentSchema);

export { UnitDocumentModel, type UnitDocumentType };
