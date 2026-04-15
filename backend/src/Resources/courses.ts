import { Courses } from "#models/courses.model";
import { RegisteredCourse } from "#models/registered.course.model";
import { UnitAssignment } from "#models/unit.assignment.model";
import { UsersUploadedPdf } from "#models/user.upload.model";
import { UnitDocumentModel } from "#models/unit.document.model";
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
        const studentRegistrations = await RegisteredCourse.find({
          studentUserNumber: existingUser.UserNumber,
        }).lean().exec();

        const registeredUnitIds = studentRegistrations.map((rc) => rc.unitId);

        // getting active courses AND any courses the student explicitly registered for
        let [userCourses] = await Courses.aggregate([
          {
            $match: {
              $or: [
                { _id: { $in: registeredUnitIds } },
                {
                  courseTitle: existingUser.programme,
                  status: "active",
                  yearOfStudy: existingUser.yearOfStudy,
                },
              ],
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
        const registeredCourses = unitIds.length
          ? await RegisteredCourse.find({
              $or: [
                { unitId: { $in: unitIds } },
                { studentUserNumber: existingUser.UserNumber }
              ]
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
          const relatedRegistrations = registeredCourses.filter(
            (registeredCourse) =>
              String(registeredCourse.unitId) === String(course._id),
          );
          const currentStudentRegistration = relatedRegistrations.find(
            (registeredCourse) =>
              registeredCourse.studentUserNumber === existingUser.UserNumber,
          );

          return {
            ...course,
            instructor: course.lecturerName || course.lecturerUserNumber || "Not assigned",
            lecturerName: course.lecturerName || lecturerAssignments[0]?.assigneeName || "",
            lecturerUserNumber:
              course.lecturerUserNumber || lecturerAssignments[0]?.assigneeUserNumber || "",
            traineeCount: relatedRegistrations.length,
            isRegistered: Boolean(currentStudentRegistration),
            registeredAt: currentStudentRegistration?.registeredAt || null,
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

          const registeredCourses = assignedUnitIds.length
            ? await RegisteredCourse.find({
                unitId: { $in: assignedUnitIds },
              })
                .lean()
                .exec()
            : [];

          const units = trainerUnits.map((unit) => {
            const unitTrainees = registeredCourses
              .filter(
                (registeredCourse) =>
                  String(registeredCourse.unitId) === String(unit._id),
              )
              .map((registeredCourse) => ({
                userNumber: registeredCourse.studentUserNumber,
                fullName: registeredCourse.studentName,
                registeredAt: registeredCourse.registeredAt,
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

          const registration = await RegisteredCourse.findOneAndUpdate(
            {
              unitId: (unit as any)._id,
              studentUserNumber: existingUser.UserNumber,
            },
            {
              $set: {
                courseTitle: unit.courseTitle,
                unitCode: unit.unitCode,
                unitName: unit.unitName,
                studentName: existingUser.fullName,
                programme: existingUser.programme,
                department: existingUser.department || "",
                yearOfStudy: existingUser.yearOfStudy || 1,
                status: "registered",
                registeredAt: new Date(),
              },
            },
            {
              new: true,
              upsert: true,
              setDefaultsOnInsert: true,
            },
          ).lean();

          const traineeCount = await RegisteredCourse.countDocuments({
            unitId: (unit as any)._id,
          });

          res.status(200).json({
            success: true,
            message: "Unit registered successfully",
            registration,
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

CoursesRouter.get(
  "/units/:unitId/documents",
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

          const unit = await Courses.findById(req.params.unitId).lean().exec();

          if (!unit) {
            res.status(404).json({ message: "Unit not found" });
            return;
          }

          if (String(existingUser.role).trim().toLowerCase() === "student") {
            const isRegistered = await RegisteredCourse.exists({
              unitId: (unit as any)._id,
              studentUserNumber: existingUser.UserNumber,
            });

            if (!isRegistered) {
              return res.status(403).json({
                success: false,
                message: "You must register for this unit to view materials.",
                needsRegistration: true,
              });
            }
          }

          const [uploadedPdfs, standardDocs] = await Promise.all([
            UsersUploadedPdf.find({
              unitCode: unit.unitCode,
              courseTitle: unit.courseTitle,
              status: "active",
            })
              .select(
                "originalFileName unitName unitCode courseTitle pdfUrl description uploadedByName uploadedByRole createdAt questionCount totalPoints estimatedTimeMinutes activityType",
              )
              .sort({ createdAt: -1 })
              .lean()
              .exec(),
            UnitDocumentModel.find({
              unitCode: unit.unitCode,
              courseTitle: unit.courseTitle,
              status: "active",
            })
              .select(
                "originalFileName unitName unitCode courseTitle pdfUrl description uploadedByName uploadedByRole createdAt",
              )
              .sort({ createdAt: -1 })
              .lean()
              .exec()
          ]);

          const combinedDocuments = [
            ...uploadedPdfs.map((doc: any) => ({
              ...doc,
              activityType: doc.activityType || "assessment",
            })),
            ...standardDocs.map((doc: any) => ({
              ...doc,
              activityType: "document",
              questionCount: 0,
              totalPoints: 0,
              estimatedTimeMinutes: 0,
            }))
          ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const lecturerAssignment = await UnitAssignment.findOne({
            unitId: (unit as any)._id,
            assignmentType: "lecturer",
          })
            .lean()
            .exec();

          return res.status(200).json({
            success: true,
            unit: {
              _id: (unit as any)._id,
              courseTitle: unit.courseTitle,
              unitCode: unit.unitCode,
              unitName: unit.unitName,
              department: unit.department,
              yearOfStudy: unit.yearOfStudy,
              lecturerName: unit.lecturerName || lecturerAssignment?.assigneeName || "",
              lecturerUserNumber:
                unit.lecturerUserNumber || lecturerAssignment?.assigneeUserNumber || "",
            },
            documents: combinedDocuments.map((doc: any) => ({
              _id: doc._id,
              title: doc.originalFileName,
              unitName: doc.unitName,
              unitCode: doc.unitCode,
              courseTitle: doc.courseTitle,
              pdfUrl: doc.pdfUrl,
              description: doc.description || "",
              uploadedByName: doc.uploadedByName || "System",
              uploadedByRole: doc.uploadedByRole || "admin",
              createdAt: doc.createdAt,
              questionCount: doc.questionCount || 0,
              totalPoints: doc.totalPoints || 0,
              estimatedTimeMinutes: doc.estimatedTimeMinutes || 0,
              activityType: doc.activityType || "assessment",
            })),
            count: combinedDocuments.length,
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
      console.error("Error in /units/:unitId/documents:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);
