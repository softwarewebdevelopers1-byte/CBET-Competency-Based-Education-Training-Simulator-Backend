import { Courses } from "#models/courses.model";
import { Router, type Request, type Response } from "express";

export let CoursesRouter = Router();
CoursesRouter.post("/", async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  let {
    courseTitle,
    unitCode,
    unitName,
    description,
    department,
    duration,
    status,
  } = req.body;
  //   creating courses
  await Courses.create({
    courseTitle,
    unitCode,
    unitName,
    description,
    department,
    duration,
    status,
  });
});
