import { Courses } from "#models/courses.model";
import jwt from "jsonwebtoken";
import { Router, type Request, type Response } from "express";
import { User } from "#models/user.model";

export let CoursesRouter = Router();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw Error("Raw access token is missing");
}
CoursesRouter.post("/add/courses", async (req: Request, res: Response) => {
  if (!req.body) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  let {
    courseTitle,
    unitCode,
    unitName,
    department,

    status,
  } = req.body;
  //   creating courses
  await Courses.create({
    courseTitle,
    unitCode,
    unitName,
    department,
    status,
  });
});
CoursesRouter.post("/my/courses", async (req: Request, res: Response) => {
  const accessToken = req.cookies?.CBET7U4D_Host_AccessToken;
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

  if (!ACCESS_TOKEN_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  if (!accessToken) {
    return res
      .status(401)
      .json({ message: "No token provided", isLoggedIn: false });
  }

  try {
    jwt.verify(
      accessToken,
      ACCESS_TOKEN_SECRET,
      async (err: any, load: any) => {
        if (err) {
          res.status(401).json({ message: "Token verification failed" });
          return;
        }
        let existingUser = await User.findOne({ UserNumber: load.userNumber });
        if (!existingUser) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        let userCourses = await Courses.find({
          courseTitle: existingUser.programme,
        });
        return res.status(200).json({
          success: true,
          courses: userCourses,
        });
      },
    );
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        isLoggedIn: false,
        needsRefresh: true,
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token", isLoggedIn: false });
    }
    console.error("Error in /my/courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
