import mongoose, { Model } from "mongoose";
interface CoursesInterface {
  yearOfStudy?: number;
  courseTitle: string;
  unitCode: string;
  unitName: string;
  department: string;
  status: string;
  lecturerUserNumber?: string;
  lecturerName?: string;
}
// interface CompletedCourses {
//   owner: string;
//   yearOfStudy: number;
//   unitName: string;
//   unitCode: string;
// }
let CourseSchema = new mongoose.Schema<CoursesInterface>({
  yearOfStudy: {
    type: Number,
    default: 1,
  },
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
  lecturerUserNumber: {
    type: String,
    default: "",
    trim: true,
  },
  lecturerName: {
    type: String,
    default: "",
    trim: true,
  },
});
export let Courses =
  (mongoose.models.courses as Model<CoursesInterface>) ||
  mongoose.model<CoursesInterface>("courses", CourseSchema);
