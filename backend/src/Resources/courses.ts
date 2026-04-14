import { Courses } from "#models/courses.model";
import { UnitAssignment } from "#models/unit.assignment.model";
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
        // getting active courses
        let [userCourses] = await Courses.aggregate([
          {
            $match: {
              courseTitle: existingUser.programme,
              status: "active",
              yearOfStudy: existingUser.yearOfStudy,
            },
          },
          {
            $sort: {
              unitCode: 1,
            },
          },
          {
            $facet: {
              data: [],
              totalCount: [{ $count: "count" }],
            },
          },
        ]);
        let [completedCourses] = await Courses.aggregate([
          {
            $match: {
              courseTitle: existingUser.programme,
              yearOfStudy: { $lt: existingUser.yearOfStudy },
            },
          },
          {
            $facet: {
              // data: [{ $limit: 5 }],
              totalCount: [{ $count: "count" }],
            },
          },
        ]);
        const activeCourses = Array.isArray(userCourses?.data)
          ? userCourses.data
          : [];
        const unitIds = activeCourses.map((course: any) => course._id).filter(Boolean);
        const unitAssignments = unitIds.length
          ? await UnitAssignment.find({
              unitId: { $in: unitIds },
            })
              .lean()
              .exec()
          : [];

        const coursesWithAssignments = activeCourses.map((course: any) => {
          const relatedAssignments = unitAssignments.filter(
            (assignment) => String(assignment.unitId) === String(course._id),
          );
          const lecturerAssignments = relatedAssignments.filter(
            (assignment) => assignment.assignmentType === "lecturer",
          );
          const traineeAssignments = relatedAssignments.filter(
            (assignment) => assignment.assignmentType === "trainee",
          );
          const currentStudentAssignment = traineeAssignments.find(
            (assignment) =>
              assignment.assigneeUserNumber === existingUser.UserNumber,
          );

          return {
            ...course,
            instructor: course.lecturerName || course.lecturerUserNumber || "Not assigned",
            lecturerName: course.lecturerName || lecturerAssignments[0]?.assigneeName || "",
            lecturerUserNumber:
              course.lecturerUserNumber || lecturerAssignments[0]?.assigneeUserNumber || "",
            assignedTrainees: traineeAssignments.map((assignment) => ({
              userNumber: assignment.assigneeUserNumber,
              fullName: assignment.assigneeName,
            })),
            traineeCount: traineeAssignments.length,
            isRegistered: Boolean(currentStudentAssignment),
            registeredAt: currentStudentAssignment?.assignedAt || null,
          };
        });

        return res.status(200).json({
          success: true,
          courses: coursesWithAssignments,
          count: userCourses.totalCount,
          completedCourses: completedCourses.totalCount,
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

CoursesRouter.get(
  "/trainer/assigned-units",
  async (req: Request, res: Response) => {
    const accessToken = req.cookies?.CBET7U4D_Host_AccessToken;

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

          const existingUser = await User.findOne({ UserNumber: load.userNumber })
            .lean()
            .exec();

          if (!existingUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
          }

          if (String(existingUser.role).trim().toLowerCase() !== "trainer") {
            res.status(403).json({ message: "Trainer privileges required" });
            return;
          }

          const lecturerAssignments = await UnitAssignment.find({
            assignmentType: "lecturer",
            assigneeUserNumber: existingUser.UserNumber,
          })
            .lean()
            .exec();

          const assignedUnitIds = lecturerAssignments.map((item) => item.unitId);
          const trainerUnits = assignedUnitIds.length
            ? await Courses.find({ _id: { $in: assignedUnitIds } })
                .sort({ courseTitle: 1, yearOfStudy: 1, unitCode: 1 })
                .lean()
                .exec()
            : [];

          const traineeAssignments = assignedUnitIds.length
            ? await UnitAssignment.find({
                unitId: { $in: assignedUnitIds },
                assignmentType: "trainee",
              })
                .lean()
                .exec()
            : [];

          const units = trainerUnits.map((unit) => {
            const unitTrainees = traineeAssignments
              .filter((assignment) => String(assignment.unitId) === String(unit._id))
              .map((assignment) => ({
                userNumber: assignment.assigneeUserNumber,
                fullName: assignment.assigneeName,
              }));

            return {
              ...unit,
              traineeCount: unitTrainees.length,
              trainees: unitTrainees,
            };
          });

          return res.status(200).json({
            success: true,
            units,
            count: units.length,
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
      console.error("Error in /trainer/assigned-units:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

CoursesRouter.post(
  "/units/:unitId/register",
  async (req: Request, res: Response) => {
    const accessToken = req.cookies?.CBET7U4D_Host_AccessToken;

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

          const existingUser = await User.findOne({ UserNumber: load.userNumber })
            .lean()
            .exec();

          if (!existingUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
          }

          if (String(existingUser.role).trim().toLowerCase() !== "student") {
            res.status(403).json({ message: "Student privileges required" });
            return;
          }

          const unit = await Courses.findById(req.params.unitId).exec();

          if (!unit) {
            res.status(404).json({ message: "Unit not found for this student" });
            return;
          }

          if (
            unit.courseTitle !== existingUser.programme ||
            unit.yearOfStudy !== existingUser.yearOfStudy ||
            unit.status !== "active"
          ) {
            res.status(403).json({
              message: "This unit is not available for the current student",
            });
            return;
          }

          const assignment = await UnitAssignment.findOneAndUpdate(
            {
              unitId: (unit as any)._id,
              assignmentType: "trainee",
              assigneeUserNumber: existingUser.UserNumber,
            },
            {
              $set: {
                courseTitle: unit.courseTitle,
                unitCode: unit.unitCode,
                unitName: unit.unitName,
                assigneeName: existingUser.fullName,
                assigneeRole: "student",
                assignedByUserNumber: existingUser.UserNumber,
                assignedAt: new Date(),
              },
            },
            {
              new: true,
              upsert: true,
              setDefaultsOnInsert: true,
            },
          ).lean();

          const traineeCount = await UnitAssignment.countDocuments({
            unitId: (unit as any)._id,
            assignmentType: "trainee",
          });

          res.status(200).json({
            success: true,
            message: "Unit registered successfully",
            assignment,
            unitId: String((unit as any)._id),
            traineeCount,
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
      console.error("Error in /units/:unitId/register:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);
