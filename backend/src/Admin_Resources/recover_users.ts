import { User } from "#models/user.model";
import { AuthenticateToken } from "#Verification/access.token";
import type { Response, Request } from "express";
import express from "express";

let RecoverUsers = express.Router();

RecoverUsers.post(
  "/",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const adminUserNumber = req.cookies?.user_1UA_XG;
    const { UserNumber } = req.body;

    if (!adminUserNumber) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }

    if (!UserNumber) {
      res.status(400).json({ error: "UserNumber is required" });
      return;
    }

    try {
      const adminUser = await User.findOne({
        UserNumber: adminUserNumber,
        role: "admin",
      });

      if (!adminUser) {
        res.status(403).json({ error: "Admin privileges required" });
        return;
      }

      const restoredUser = await User.findOneAndUpdate(
        { UserNumber },
        {
          $set: {
            status: "active",
            account_state: "approved",
          },
          $unset: {
            expiresAt: 1,
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        },
      );

      if (!restoredUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({
        message: "User account restored successfully",
        user: {
          fullName: restoredUser.fullName,
          UserNumber: restoredUser.UserNumber,
          role: restoredUser.role,
          status: restoredUser.status,
          account_state: restoredUser.account_state,
          expiresAt: restoredUser.expiresAt ?? null,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to recover user" });
    }
  },
);

export default RecoverUsers;
