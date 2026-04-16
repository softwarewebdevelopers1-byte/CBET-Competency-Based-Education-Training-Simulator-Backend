import type { Request, Response } from "express";
import { Router } from "express";
import { AuthenticateToken } from "#Verification/access.token";
import { Courses } from "#models/courses.model";
import { Programme } from "#models/programme.model";
import { RegisteredCourse } from "#models/registered.course.model";
import { UnitAssignment } from "#models/unit.assignment.model";
import { UnitDocumentModel } from "#models/unit.document.model";
import { UsersUploadedPdf } from "#models/user.upload.model";
import { User } from "#models/user.model";

export const AdminUnitManagementRouter = Router();

type ProgrammeSummary = {
  _id: string;
  title: string;
  status: string;
};

const requireAdminUser = async (
  req: Request,
  res: Response,
): Promise<{ userNumber: string } | null> => {
  const adminUserNumber = String(req.cookies?.user_1UA_XG ?? "").trim();

  if (!adminUserNumber) {
    res.status(401).json({ error: "Unauthorized access" });
    return null;
  }

  const adminUser = await User.findOne({
    UserNumber: adminUserNumber,
    role: "admin",
  })
    .select("UserNumber")
    .lean()
    .exec();

  if (!adminUser) {
    res.status(403).json({ error: "Admin privileges required" });
    return null;
  }

  return { userNumber: adminUser.UserNumber };
};

const normalizeProgramme = (value: unknown): string =>
  String(value ?? "").trim();

const normalizeStatus = (value: unknown): "active" | "inactive" =>
  String(value ?? "").trim().toLowerCase() === "inactive"
    ? "inactive"
    : "active";

const normalizeAssignmentType = (
  value: unknown,
): "trainer" | "student" | null => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "trainer") {
    return "trainer";
  }

  if (normalized === "student") {
    return "student";
  }

  return null;
};

const deleteUnitDependencies = async (
  unit: {
    _id: string;
    unitCode: string;
    courseTitle: string;
  },
) => {
  await Promise.all([
    UnitAssignment.deleteMany({ unitId: unit._id }).exec(),
    RegisteredCourse.deleteMany({ unitId: unit._id }).exec(),
    UnitDocumentModel.deleteMany({
      unitCode: unit.unitCode,
      courseTitle: unit.courseTitle,
    }).exec(),
    UsersUploadedPdf.deleteMany({
      unitCode: unit.unitCode,
      courseTitle: unit.courseTitle,
    }).exec(),
  ]);
};

AdminUnitManagementRouter.get(
  "/overview",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const [units, users, assignments, programmes] = await Promise.all([
        Courses.find(
          {},
          {
            courseTitle: true,
            unitCode: true,
            unitName: true,
            department: true,
            yearOfStudy: true,
            status: true,
            trainerUserNumber: true,
            trainerName: true,
          },
        )
          .sort({ courseTitle: 1, yearOfStudy: 1, unitCode: 1 })
          .lean()
          .exec(),
        User.find(
          { role: { $in: ["trainer", "student"] } },
          {
            fullName: true,
            UserNumber: true,
            programme: true,
            department: true,
            role: true,
            yearOfStudy: true,
            status: true,
          },
        )
          .sort({ role: 1, fullName: 1 })
          .lean()
          .exec(),
        UnitAssignment.find({})
          .sort({ assignedAt: -1 })
          .lean()
          .exec(),
        Programme.find({})
          .sort({ title: 1 })
          .lean()
          .exec(),
      ]);

      const fallbackProgrammeTitles = Array.from(
        new Set(
          [
            ...units.map((unit) => unit.courseTitle),
            ...users.map((user) => user.programme),
          ]
            .map((item) => String(item ?? "").trim())
            .filter(Boolean),
        ),
      );

      const programmeMap = new Map<string, ProgrammeSummary>();

      fallbackProgrammeTitles.forEach((title) => {
        programmeMap.set(title.toLowerCase(), {
          _id: title,
          title,
          status: "active",
        });
      });

      programmes.forEach((programme) => {
        programmeMap.set(programme.title.toLowerCase(), {
          _id: String(programme._id),
          title: programme.title,
          status: programme.status || "active",
        });
      });

      const programmeRecords = Array.from(programmeMap.values())
        .map((programme) => {
          const relatedUnits = units.filter(
            (unit) =>
              String(unit.courseTitle).trim().toLowerCase() ===
              String(programme.title).trim().toLowerCase(),
          );

          return {
            _id: programme._id,
            title: programme.title,
            status: programme.status || "active",
            unitCount: relatedUnits.length,
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title));

      res.status(200).json({
        programmes: programmeRecords,
        programmeOptions: programmeRecords.map((programme) => programme.title),
        units,
        trainers: users.filter((user) => user.role === "trainer"),
        students: users.filter((user) => user.role === "student"),
        assignments,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to load unit management data" });
    }
  },
);

AdminUnitManagementRouter.post(
  "/programmes",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const title = normalizeProgramme(req.body?.title);
      const status = normalizeStatus(req.body?.status);

      if (!title) {
        res.status(400).json({ error: "Programme title is required" });
        return;
      }

      const existingProgramme = await Programme.findOne({
        title: { $regex: new RegExp(`^${title}$`, "i") },
      })
        .lean()
        .exec();

      if (existingProgramme) {
        res.status(409).json({ error: "Programme already exists" });
        return;
      }

      const programme = await Programme.create({ title, status });

      res.status(201).json({
        message: "Programme created successfully",
        programme,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to create programme" });
    }
  },
);

AdminUnitManagementRouter.patch(
  "/programmes/:programmeId",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const programme = await Programme.findById(req.params.programmeId).exec();

      if (!programme) {
        res.status(404).json({ error: "Programme not found" });
        return;
      }

      const nextTitle = normalizeProgramme(req.body?.title) || programme.title;
      const nextStatus = normalizeStatus(req.body?.status ?? programme.status);

      const duplicateProgramme = await Programme.findOne({
        _id: { $ne: programme._id },
        title: { $regex: new RegExp(`^${nextTitle}$`, "i") },
      })
        .lean()
        .exec();

      if (duplicateProgramme) {
        res.status(409).json({ error: "Another programme with this title already exists" });
        return;
      }

      const previousTitle = programme.title;
      programme.title = nextTitle;
      programme.status = nextStatus;
      await programme.save();

      if (previousTitle !== nextTitle) {
        await Promise.all([
          Courses.updateMany(
            { courseTitle: previousTitle },
            { $set: { courseTitle: nextTitle } },
          ).exec(),
          UnitAssignment.updateMany(
            { courseTitle: previousTitle },
            { $set: { courseTitle: nextTitle } },
          ).exec(),
          RegisteredCourse.updateMany(
            { courseTitle: previousTitle },
            { $set: { courseTitle: nextTitle, programme: nextTitle } },
          ).exec(),
          UnitDocumentModel.updateMany(
            { courseTitle: previousTitle },
            { $set: { courseTitle: nextTitle, assignedProgramme: nextTitle } },
          ).exec(),
          UsersUploadedPdf.updateMany(
            { courseTitle: previousTitle },
            { $set: { courseTitle: nextTitle, assignedProgramme: nextTitle } },
          ).exec(),
          User.updateMany(
            { programme: previousTitle },
            { $set: { programme: nextTitle } },
          ).exec(),
        ]);
      }

      res.status(200).json({
        message: "Programme updated successfully",
        programme,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to update programme" });
    }
  },
);

AdminUnitManagementRouter.delete(
  "/programmes/:programmeId",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const programme = await Programme.findById(req.params.programmeId).exec();

      if (!programme) {
        res.status(404).json({ error: "Programme not found" });
        return;
      }

      const units = await Courses.find({ courseTitle: programme.title }).exec();

      for (const unit of units) {
        await deleteUnitDependencies({
          _id: String(unit._id),
          unitCode: unit.unitCode,
          courseTitle: unit.courseTitle,
        });
      }

      await Promise.all([
        Courses.deleteMany({ courseTitle: programme.title }).exec(),
        Programme.deleteOne({ _id: programme._id }).exec(),
      ]);

      res.status(200).json({
        message: "Programme and related units deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to delete programme" });
    }
  },
);

AdminUnitManagementRouter.post(
  "/programmes/:programme/units",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const programme = normalizeProgramme(req.params.programme);
      const unitCode = String(req.body?.unitCode ?? "").trim().toUpperCase();
      const unitName = String(req.body?.unitName ?? "").trim();
      const department = String(req.body?.department ?? "").trim();
      const status = normalizeStatus(req.body?.status);
      const yearOfStudy = Math.max(1, Number(req.body?.yearOfStudy) || 1);

      if (!programme || !unitCode || !unitName || !department) {
        res.status(400).json({
          error: "programme, unitCode, unitName, department, and yearOfStudy are required",
        });
        return;
      }

      const existingUnit = await Courses.findOne({
        courseTitle: programme,
        unitCode,
        yearOfStudy,
      })
        .lean()
        .exec();

      if (existingUnit) {
        res.status(409).json({
          error: "A unit with this code already exists for the selected programme and year",
        });
        return;
      }

      await Programme.findOneAndUpdate(
        { title: programme },
        { $setOnInsert: { title: programme, status: "active" } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec();

      const createdUnit = await Courses.create({
        courseTitle: programme,
        unitCode,
        unitName,
        department,
        status,
        yearOfStudy,
      });

      res.status(201).json({
        message: "Unit added to programme successfully",
        unit: createdUnit,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to add unit to programme" });
    }
  },
);

AdminUnitManagementRouter.patch(
  "/units/:unitId",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const unit = await Courses.findById(req.params.unitId).exec();

      if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return;
      }

      const nextProgramme =
        normalizeProgramme(req.body?.courseTitle) || unit.courseTitle;
      const nextUnitCode =
        String(req.body?.unitCode ?? "").trim().toUpperCase() || unit.unitCode;
      const nextUnitName = String(req.body?.unitName ?? "").trim() || unit.unitName;
      const nextDepartment =
        String(req.body?.department ?? "").trim() || unit.department;
      const nextStatus = normalizeStatus(req.body?.status ?? unit.status);
      const nextYearOfStudy = Math.max(
        1,
        Number(req.body?.yearOfStudy) || unit.yearOfStudy || 1,
      );

      const duplicateUnit = await Courses.findOne({
        _id: { $ne: unit._id },
        courseTitle: nextProgramme,
        unitCode: nextUnitCode,
        yearOfStudy: nextYearOfStudy,
      })
        .lean()
        .exec();

      if (duplicateUnit) {
        res.status(409).json({
          error: "Another unit with this code already exists for that programme and year",
        });
        return;
      }

      const previousCourseTitle = unit.courseTitle;
      const previousUnitCode = unit.unitCode;
      const previousUnitName = unit.unitName;

      unit.courseTitle = nextProgramme;
      unit.unitCode = nextUnitCode;
      unit.unitName = nextUnitName;
      unit.department = nextDepartment;
      unit.status = nextStatus;
      unit.yearOfStudy = nextYearOfStudy;
      await unit.save();

      await Programme.findOneAndUpdate(
        { title: nextProgramme },
        { $setOnInsert: { title: nextProgramme, status: "active" } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec();

      await Promise.all([
        UnitAssignment.updateMany(
          { unitId: unit._id },
          {
            $set: {
              courseTitle: nextProgramme,
              unitCode: nextUnitCode,
              unitName: nextUnitName,
            },
          },
        ).exec(),
        RegisteredCourse.updateMany(
          { unitId: unit._id },
          {
            $set: {
              courseTitle: nextProgramme,
              unitCode: nextUnitCode,
              unitName: nextUnitName,
              programme: nextProgramme,
              yearOfStudy: nextYearOfStudy,
              department: nextDepartment,
            },
          },
        ).exec(),
        UnitDocumentModel.updateMany(
          {
            courseTitle: previousCourseTitle,
            unitCode: previousUnitCode,
            unitName: previousUnitName,
          },
          {
            $set: {
              courseTitle: nextProgramme,
              unitCode: nextUnitCode,
              unitName: nextUnitName,
              assignedProgramme: nextProgramme,
              department: nextDepartment,
              yearOfStudy: nextYearOfStudy,
              status: nextStatus,
            },
          },
        ).exec(),
        UsersUploadedPdf.updateMany(
          {
            courseTitle: previousCourseTitle,
            unitCode: previousUnitCode,
          },
          {
            $set: {
              courseTitle: nextProgramme,
              unitCode: nextUnitCode,
              assignedProgramme: nextProgramme,
              assignedDepartment: nextDepartment,
              yearOfStudy: nextYearOfStudy,
              status: nextStatus,
            },
          },
        ).exec(),
      ]);

      res.status(200).json({
        message: "Unit updated successfully",
        unit,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to update unit" });
    }
  },
);

AdminUnitManagementRouter.delete(
  "/units/:unitId",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const unit = await Courses.findById(req.params.unitId).lean().exec();

      if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return;
      }

      await deleteUnitDependencies({
        _id: String(unit._id),
        unitCode: unit.unitCode,
        courseTitle: unit.courseTitle,
      });
      await Courses.deleteOne({ _id: unit._id }).exec();

      res.status(200).json({
        message: "Unit and related assignments deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to delete unit" });
    }
  },
);

AdminUnitManagementRouter.post(
  "/programmes/:programme/units/bulk",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const programme = normalizeProgramme(req.params.programme);
      const incomingUnits = Array.isArray(req.body?.units) ? req.body.units : [];

      if (!programme || incomingUnits.length === 0) {
        res.status(400).json({
          error: "programme and at least one unit are required",
        });
        return;
      }

      await Programme.findOneAndUpdate(
        { title: programme },
        { $setOnInsert: { title: programme, status: "active" } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec();

      const results = [];
      const skipped = [];

      for (const item of incomingUnits) {
        const unitCode = String(item?.unitCode ?? "").trim().toUpperCase();
        const unitName = String(item?.unitName ?? "").trim();
        const department = String(item?.department ?? "").trim();
        const status = normalizeStatus(item?.status);
        const yearOfStudy = Math.max(1, Number(item?.yearOfStudy) || 1);

        if (!unitCode || !unitName || !department) {
          skipped.push({
            unitCode: unitCode || "N/A",
            reason: "unitCode, unitName, department, and yearOfStudy are required",
          });
          continue;
        }

        const exists = await Courses.findOne({
          courseTitle: programme,
          unitCode,
          yearOfStudy,
        })
          .lean()
          .exec();

        if (exists) {
          skipped.push({
            unitCode,
            reason: "Duplicate unit for programme and year",
          });
          continue;
        }

        const createdUnit = await Courses.create({
          courseTitle: programme,
          unitCode,
          unitName,
          department,
          status,
          yearOfStudy,
        });

        results.push(createdUnit);
      }

      res.status(201).json({
        message: "Bulk programme unit upload processed",
        createdCount: results.length,
        skippedCount: skipped.length,
        units: results,
        skipped,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to add units to programme" });
    }
  },
);

AdminUnitManagementRouter.post(
  "/units/:unitId/assignments",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const unitId = String(req.params.unitId ?? "").trim();
      const assigneeUserNumber = String(req.body?.assigneeUserNumber ?? "").trim();
      const assignmentType = normalizeAssignmentType(req.body?.assignmentType);

      if (!unitId || !assigneeUserNumber || !assignmentType) {
        res.status(400).json({
          error: "unitId, assigneeUserNumber, and a valid assignmentType are required",
        });
        return;
      }

      const unit = await Courses.findById(unitId).exec();

      if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return;
      }

      const assignee = await User.findOne({ UserNumber: assigneeUserNumber })
        .lean()
        .exec();

      if (!assignee) {
        res.status(404).json({ error: "Assignee not found" });
        return;
      }

      const requiredRole = assignmentType;

      if (String(assignee.role).trim().toLowerCase() !== requiredRole) {
        res.status(400).json({
          error: `Selected user must have the role ${requiredRole}`,
        });
        return;
      }

      const existingAssignment = await UnitAssignment.findOne({
        unitId: unit._id,
        assignmentType,
      })
        .lean()
        .exec();

      if (existingAssignment) {
        const label = assignmentType === "trainer" ? "trainer" : "student";
        const sameAssignee =
          existingAssignment.assigneeUserNumber === assignee.UserNumber;
        res.status(409).json({
          error: sameAssignee
            ? `This unit is already assigned to the selected ${label}.`
            : `This unit already has an assigned ${label}. Use the update action to replace them.`,
        });
        return;
      }

      if (assignmentType === "trainer") {
        unit.trainerUserNumber = assignee.UserNumber;
        unit.trainerName = assignee.fullName;
        await unit.save();
      }

      const assignment = await UnitAssignment.create({
        unitId: unit._id,
        assignmentType,
        courseTitle: unit.courseTitle,
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        assigneeUserNumber: assignee.UserNumber,
        assigneeName: assignee.fullName,
        assigneeRole: requiredRole,
        assignedByUserNumber: adminUser.userNumber,
        assignedAt: new Date(),
      });

      res.status(200).json({
        message: "Unit assignment saved successfully",
        assignment,
        unit,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to assign user to unit" });
    }
  },
);

AdminUnitManagementRouter.patch(
  "/units/:unitId/assignments/:assignmentType",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const assignmentType = normalizeAssignmentType(req.params.assignmentType);
      const assigneeUserNumber = String(req.body?.assigneeUserNumber ?? "").trim();

      if (!assignmentType || !assigneeUserNumber) {
        res.status(400).json({
          error: "A valid assignmentType and assigneeUserNumber are required",
        });
        return;
      }

      const unit = await Courses.findById(req.params.unitId).exec();

      if (!unit) {
        res.status(404).json({ error: "Unit not found" });
        return;
      }

      const existingAssignment = await UnitAssignment.findOne({
        unitId: unit._id,
        assignmentType,
      }).exec();

      if (!existingAssignment) {
        res.status(404).json({ error: "Assignment not found" });
        return;
      }

      const assignee = await User.findOne({ UserNumber: assigneeUserNumber })
        .lean()
        .exec();

      if (!assignee) {
        res.status(404).json({ error: "Assignee not found" });
        return;
      }

      if (String(assignee.role).trim().toLowerCase() !== assignmentType) {
        res.status(400).json({
          error: `Selected user must have the role ${assignmentType}`,
        });
        return;
      }

      existingAssignment.assigneeUserNumber = assignee.UserNumber;
      existingAssignment.assigneeName = assignee.fullName;
      existingAssignment.assigneeRole = assignmentType;
      existingAssignment.assignedByUserNumber = adminUser.userNumber;
      existingAssignment.assignedAt = new Date();
      await existingAssignment.save();

      if (assignmentType === "trainer") {
        unit.trainerUserNumber = assignee.UserNumber;
        unit.trainerName = assignee.fullName;
        await unit.save();
      }

      res.status(200).json({
        message: "Unit assignment updated successfully",
        assignment: existingAssignment,
        unit,
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to update unit assignment" });
    }
  },
);
