import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { Router } from "express";
import { AuthenticateToken } from "#Verification/access.token";
import { User } from "#models/user.model";

type AllowedRole = "student" | "trainer" | "admin";

export const AdminUsersRouter = Router();
export const UserNumber = Router();

const normalizeRole = (role: string): AllowedRole | null => {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === "student") {
    return "student";
  }

  if (normalizedRole === "trainer" || normalizedRole === "trainee") {
    return "trainer";
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  return null;
};

const requireAdminUser = async (
  req: Request,
  res: Response,
): Promise<boolean> => {
  const adminUserNumber = req.cookies?.user_1UA_XG;

  if (!adminUserNumber) {
    res.status(401).json({ error: "Unauthorized access" });
    return false;
  }

  const adminUser = await User.findOne({
    UserNumber: adminUserNumber,
    role: "admin",
  });

  if (!adminUser) {
    res.status(403).json({ error: "Admin privileges required" });
    return false;
  }

  return true;
};

AdminUsersRouter.get(
  "/",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const hasAdminAccess = await requireAdminUser(req, res);

      if (!hasAdminAccess) {
        return;
      }

      const users = await User.find(
        { role: { $ne: "admin" } },
        {
          _id: false,
          fullName: true,
          UserNumber: true,
          yearOfStudy: true,
          department: true,
          programme: true,
          role: true,
          status: true,
          account_state: true,
          expiresAt: true,
        },
      )
        .sort({ fullName: 1, UserNumber: 1 })
        .lean()
        .exec();

      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ error: "Unable to fetch users" });
    }
  },
);

AdminUsersRouter.post(
  "/",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const hasAdminAccess = await requireAdminUser(req, res);

      if (!hasAdminAccess) {
        return;
      }

      const normalizedRole = normalizeRole(String(req.body?.role ?? ""));
      const fullName = String(req.body?.fullName ?? "").trim();
      const userNumber = String(req.body?.UserNumber ?? "").trim();
      const department = String(req.body?.department ?? "").trim();
      const programme = String(req.body?.programme ?? "").trim();
      const parsedYearOfStudy = Number(req.body?.yearOfStudy);

      if (!fullName || !userNumber || !normalizedRole) {
        res.status(400).json({
          error: "fullName, UserNumber, and a valid role are required",
        });
        return;
      }

      const existingUser = await User.findOne({ UserNumber: userNumber });

      if (existingUser) {
        res.status(409).json({ error: "UserNumber already exists" });
        return;
      }

      const defaultPassword =
        normalizedRole === "student" ? "student123" : "staff123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const createdUser = await User.create({
        fullName,
        UserNumber: userNumber,
        yearOfStudy:
          normalizedRole === "student" && Number.isFinite(parsedYearOfStudy)
            ? Math.max(1, parsedYearOfStudy)
            : 1,
        department,
        programme,
        password: hashedPassword,
        role: normalizedRole,
        status: "active",
        account_state: "approved",
      });

      res.status(201).json({
        message: "User created successfully",
        defaultPassword,
        user: {
          fullName: createdUser.fullName,
          UserNumber: createdUser.UserNumber,
          yearOfStudy: createdUser.yearOfStudy,
          department: createdUser.department,
          programme: createdUser.programme,
          role: createdUser.role,
          status: createdUser.status,
          account_state: createdUser.account_state,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to create user" });
    }
  },
);

AdminUsersRouter.put(
  "/:userNumber",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const hasAdminAccess = await requireAdminUser(req, res);

      if (!hasAdminAccess) {
        return;
      }

      const currentUserNumber = String(req.params.userNumber ?? "").trim();
      const nextUserNumber = String(req.body?.UserNumber ?? currentUserNumber).trim();
      const fullName = String(req.body?.fullName ?? "").trim();
      const department = String(req.body?.department ?? "").trim();
      const programme = String(req.body?.programme ?? "").trim();
      const password = String(req.body?.password ?? "").trim();
      const normalizedRole = normalizeRole(String(req.body?.role ?? ""));
      const parsedYearOfStudy = Number(req.body?.yearOfStudy);

      if (!currentUserNumber || !nextUserNumber || !fullName || !normalizedRole) {
        res.status(400).json({
          error: "fullName, UserNumber, and a valid role are required",
        });
        return;
      }

      const existingUser = await User.findOne({ UserNumber: currentUserNumber });

      if (!existingUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (currentUserNumber !== nextUserNumber) {
        const duplicateUser = await User.findOne({ UserNumber: nextUserNumber });

        if (duplicateUser) {
          res.status(409).json({ error: "UserNumber already exists" });
          return;
        }
      }

      const updatePayload: {
        fullName: string;
        UserNumber: string;
        yearOfStudy: number;
        department: string;
        programme: string;
        role: AllowedRole;
        password?: string;
      } = {
        fullName,
        UserNumber: nextUserNumber,
        yearOfStudy:
          normalizedRole === "student" && Number.isFinite(parsedYearOfStudy)
            ? Math.max(1, parsedYearOfStudy)
            : 1,
        department,
        programme,
        role: normalizedRole,
      };

      if (password) {
        updatePayload.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await User.findOneAndUpdate(
        { UserNumber: currentUserNumber },
        {
          $set: updatePayload,
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        },
      );

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({
        message: "User updated successfully",
        passwordUpdated: Boolean(password),
        user: {
          fullName: updatedUser.fullName,
          UserNumber: updatedUser.UserNumber,
          yearOfStudy: updatedUser.yearOfStudy,
          department: updatedUser.department,
          programme: updatedUser.programme,
          role: updatedUser.role,
          status: updatedUser.status,
          account_state: updatedUser.account_state,
          expiresAt: updatedUser.expiresAt ?? null,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to update user" });
    }
  },
);

UserNumber.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await User.countDocuments({});
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: "Counting users error" });
  }
});
