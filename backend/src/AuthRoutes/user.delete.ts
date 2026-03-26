import type { Request, Response } from "express";
import { Router } from "express";
import { RefreshToken as DbRefreshToken } from "#models/token.model";
import { AuthenticateToken } from "#Verification/access.token";
import { User } from "#models/user.model";

export let UserDeleteRoute = Router();
export let AdminDeleteUser = Router();
AdminDeleteUser.delete(
  "/",
  AuthenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    let adminUserNumber = req.cookies?.user_1UA_XG;
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
      let adminExists = await User.findOne({
        UserNumber: adminUserNumber,
        role: "admin",
      });
      if (!adminExists) {
        res.status(403).json({ error: "Admin privileges required" });
        return;
      }

      let suspendedUser = await User.findOneAndUpdate(
        { UserNumber: UserNumber },
        {
          $set: {
            account_state: "suspended",
            status: "suspended",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        },
      );

      if (!suspendedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await DbRefreshToken.deleteMany({ UserNumber });
      res.status(200).json({
        message: "User suspended and scheduled for deletion in 7 days",
        user: {
          UserNumber: suspendedUser.UserNumber,
          status: suspendedUser.status,
          account_state: suspendedUser.account_state,
          expiresAt: suspendedUser.expiresAt,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Unable to delete user" });
    }
  },
);
UserDeleteRoute.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.cookies?.Host_AU1_Auth_2Wa__DeviceId;
    const UserUserNumber = req.cookies?.user_1UA_XG;
    const RefreshToken = req.cookies?.CBET_3ga_auth_RefreshToken;
    if (!deviceId || !UserUserNumber || !RefreshToken) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }
    try {
      await User.findOneAndUpdate(
        { UserNumber: UserUserNumber },
        {
          $set: {
            account_state: "suspended",
            status: "suspended",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        },
      );
      await DbRefreshToken.deleteMany({ UserNumber: UserUserNumber });
      // all other info am supposed to delete comes here
      res.clearCookie("CBET7U4D_Host_AccessToken");
      res.clearCookie("CBET_3ga_auth_RefreshToken");
      res.clearCookie("Host_AU1_Auth_2Wa__DeviceId");
      res.clearCookie("user_1UA_XG");
      res.status(200).json({
        message: "User account suspended and scheduled for deletion in 7 days",
      });
    } catch (error) {
      console.log("Unable to delete user");
      res.status(500).json({ error: "Server unable to delete user" });
    }
  },
);
