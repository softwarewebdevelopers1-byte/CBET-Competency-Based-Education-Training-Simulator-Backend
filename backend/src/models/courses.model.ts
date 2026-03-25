import mongoose, { Model } from "mongoose";
interface CoursesInterface {
  courseTitle: string;
  unitCode: string;
  unitName: string;
  department: string;
  status: string;
}
let CourseSchema = new mongoose.Schema<CoursesInterface>({
  courseTitle: {
    type: String,
    required: true,
  },

  unitCode: {
    type: String,
    required: true,
  },

  unitName: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});
export let Courses =
  (mongoose.models.courses as Model<CoursesInterface>) ||
  mongoose.model<CoursesInterface>("courses", CourseSchema);
