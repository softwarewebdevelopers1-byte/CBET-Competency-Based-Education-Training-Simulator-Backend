import { Router } from "express";
import { User } from "#models/user.model";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { signUpLimit } from "#Verification/rate.limit";
import { generateAccessToken } from "#Verification/access.token";
dotenv.config();
class SignUpFlow {
  SignUp = async (req: Request, res: Response) => {
    try {
      // validating if user sends data
      if (!req.body)
        return res.status(403).json({ issue: "Unauthorized access" });
      const { UserNumber, password } = req.body;
      if (!UserNumber || !password) {
        return res
          .status(400)
          .send({ message: "UserNumber and password are required" });
      }
      // validating ig user already exists
      let userExists = await User.findOne({
        UserNumber: UserNumber,
      });
      if (userExists) {
        return res.status(409).send({ message: "UserNumber already exists" });
      }
      // Create user directly (no OTP verification)
      const hashPassword = await bcrypt.hash(password, 10);
      await User.create({ UserNumber: UserNumber, password: hashPassword });

      // generate short-lived access token and set cookie
      let accessToken = generateAccessToken(req);
      res.cookie("CBET7U4D_Host_AccessToken", accessToken, {
        httpOnly: true,
        maxAge: 60 * 1000 * 5,
        secure: true,
        sameSite: "none",
      });

      res
        .status(201)
        .json({ message: "User created", user: UserNumber.split("@")[0] });
    } catch (error) {
      res.status(500).send({ success: false });
      console.log(error);
    }
  };
}
let Sign = new SignUpFlow();
let signUpRouter = Router();
signUpRouter.post("/", signUpLimit(), Sign.SignUp);
export { signUpRouter };
//# sourceMappingURL=sign_up.js.map
