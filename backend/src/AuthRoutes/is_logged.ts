import { Router } from "express";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { User } from "#models/user.model";

let IsLoggedRoute = Router();

IsLoggedRoute.post("/", async (req: Request, res: Response): Promise<void> => {
  const accessToken = req.cookies?.CBET7U4D_Host_AccessToken;
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

  if (!ACCESS_TOKEN_SECRET || !accessToken) {
    res.status(401).json({ message: "Session expired", isLoggedIn: false });
    return;
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
        res.status(200).json({
          message: "User is logged in",
          role: existingUser.role,
          fullName: existingUser.fullName,
          userNumber: existingUser.UserNumber,
          isLoggedIn: true,
        });
      },
    );
  } catch (error) {
    res.status(401).json({
      message: "Session expired",
      isLoggedIn: false,
      error:
        error instanceof jwt.JsonWebTokenError
          ? error.message
          : "Invalid token",
    });
  }
});

export default IsLoggedRoute;
