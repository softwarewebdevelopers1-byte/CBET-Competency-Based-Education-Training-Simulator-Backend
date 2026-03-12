import type { Request, Response } from "express";
import { Router } from "express";
import { RefreshToken as DbRefreshToken } from "#models/token.model";
import { User } from "#models/user.model";

export let UserDeleteRoute = Router();
export let AdminDeleteUser = Router();
AdminDeleteUser.delete(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    let adminEmail = req.cookies?.Q_user_1334G_XG;
    let adminDeviceId = req.cookies?.Host_wqc_Auth_4rt__DeviceId;
    let adminRefreshToken = req.cookies?.ptq2_was_auth_RefreshToken;
    const { email } = req.body;
    if (!adminEmail || !adminDeviceId || !adminRefreshToken) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    try {
      User.findOneAndDelete({ email: email });
      res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Unable to delete user" });
    }
  },
);
UserDeleteRoute.post(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.cookies?.Host_AU1_Auth_2Wa__DeviceId;
    const UserEmail = req.cookies?.user_1UA_XG;
    const RefreshToken = req.cookies?.CBET_3ga_auth_RefreshToken;
    if (!deviceId || !UserEmail || !RefreshToken) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }
    try {
      await User.findOneAndUpdate(
        { email: UserEmail },
        {
          $set: {
            account_state: "Inactive",
            status: "Inactive",
            role: "Deleted",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        },
      );
      await DbRefreshToken.deleteMany({ email: UserEmail });
      // all other info am supposed to delete comes here
      res.clearCookie("CBET7U4D_Host_AccessToken");
      res.clearCookie("CBET_3ga_auth_RefreshToken");
      res.clearCookie("Host_AU1_Auth_2Wa__DeviceId");
      res.clearCookie("user_1UA_XG");
      res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
      console.log("Unable to delete user");
      res.status(500).json({ error: "Server unable to delete user" });
    }
  },
);
