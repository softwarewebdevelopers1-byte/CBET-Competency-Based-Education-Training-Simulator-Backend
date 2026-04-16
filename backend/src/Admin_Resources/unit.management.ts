import type { Request, Response } from "express";
import { Router } from "express";
import { AuthenticateToken } from "#Verification/access.token";
import { Courses } from "#models/courses.model";
import { UnitAssignment } from "#models/unit.assignment.model";
import { User } from "#models/user.model";

export const AdminUnitManagementRouter = Router();

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

AdminUnitManagementRouter.get(
  "/overview",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminUser = await requireAdminUser(req, res);

      if (!adminUser) {
        return;
      }

      const [units, users, assignments] = await Promise.all([
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
      ]);

      const programmes = Array.from(
        new Set(
          [
            ...units.map((unit) => unit.courseTitle),
            ...users.map((user) => user.programme),
          ]
            .map((item) => String(item ?? "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));

      res.status(200).json({
        programmes,
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
      const status = String(req.body?.status ?? "active").trim() || "active";
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

      const results = [];
      const skipped = [];

      for (const item of incomingUnits) {
        const unitCode = String(item?.unitCode ?? "").trim().toUpperCase();
        const unitName = String(item?.unitName ?? "").trim();
        const department = String(item?.department ?? "").trim();
        const status = String(item?.status ?? "active").trim() || "active";
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
            : `This unit already has an assigned ${label}. Remove the current assignment before assigning another one.`,
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
