import type { Request, Response } from "express";
import { Router } from "express";
import { AuthenticateToken } from "#Verification/access.token";
import { User } from "#models/user.model";

export const GetUsers = Router();
export const UserNumber = Router();

GetUsers.get(
  "/",
  AuthenticateToken,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find(
        {},
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

UserNumber.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await User.countDocuments({});
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: "Counting users error" });
  }
});
