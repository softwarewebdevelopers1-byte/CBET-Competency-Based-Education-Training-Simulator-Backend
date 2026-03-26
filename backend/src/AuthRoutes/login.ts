import type { Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { User } from "#models/user.model";
import { compare, hash } from "bcrypt";
import { Router } from "express";
import { loginLimit } from "#Verification/rate.limit";
import {
  generateAccessToken,
  generateRefreshToken,
} from "#Verification/access.token";
import { RefreshToken } from "#models/token.model";
let logRouter = Router();
// constructing interface blueprint
interface LoginFace {
  UserNumber: string;
  password: string;
}
// login class flow
class LoginFlow {
  Login = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body) {
        res.status(403).json({ issue: "Unauthorized access" });
        return;
      }
      const { UserNumber, password }: LoginFace = req.body;
      if (!UserNumber || !password) {
        res.status(400).json({
          message: "UserNumber and password are required ",
          success: false,
        });
        return;
      }
      let user = await User.findOne({
        UserNumber: UserNumber,
        account_state: "approved",
      });
      if (!user) {
        res.status(401).json({
          message: "Invalid credentials or account is suspended",
          success: false,
        });
        return;
      }

      let matching = await compare(password, user.password);
      if (!matching) {
        res.status(401).json({ message: "Invalid password", success: false });
        return;
      }
      if (user && matching) {
        // clear existing cookies
        res.clearCookie("CBET7U4D_Host_AccessToken");
        res.clearCookie("CBET_3ga_auth_RefreshToken");
        res.clearCookie("Host_AU1_Auth_2Wa__DeviceId");
        res.clearCookie("user_1UA_XG");
        //
        let AccessToken = generateAccessToken(req);
        // duration for refresh token
        const duration = 7 * 24 * 60 * 60 * 1000;
        // duration for access token
        const duration2 = 60 * 1000 * 15;

        let RefreshTokenAccess = generateRefreshToken(req);
        let DeviceId = uuidv4();
        let HashedRefreshToken = await hash(RefreshTokenAccess, 10);
        await RefreshToken.create({
          UserNumber: UserNumber,
          refreshToken: HashedRefreshToken,
          deviceId: DeviceId,
        });
        await User.findOneAndUpdate(
          { UserNumber: UserNumber },
          { $set: { status: "Active" } },
          {
            returnDocument: "after", // to silence the warning
            runValidators: true,
            upsert: false,
          },
        );
        // sending access token as cookie

        // access token uses shorter maxAge
        res.cookie("CBET7U4D_Host_AccessToken", AccessToken, {
          httpOnly: true,
          maxAge: duration2,
          secure: true,
          sameSite: "none",
        });

        res.cookie("user_1UA_XG", UserNumber, {
          httpOnly: true,
          maxAge: duration,
          secure: true,
          sameSite: "none",
        });

        // sending refresh token as cookie
        res.cookie("CBET_3ga_auth_RefreshToken", RefreshTokenAccess, {
          httpOnly: true,
          maxAge: duration,
          secure: true,
          sameSite: "none",
        });

        // sending device Id as cookie
        res.cookie("Host_AU1_Auth_2Wa__DeviceId", DeviceId, {
          httpOnly: true,
          maxAge: duration,
          secure: true,
          sameSite: "none",
        });
        res
          .status(200)
          .json({ user: user.fullName, role: user.role, success: true });
      }
    } catch (err) {
      res.status(500).json({ error: err });
    }
  };
}
let login = new LoginFlow();
logRouter.post("/", loginLimit(), login.Login);
export { logRouter };
//# sourceMappingURL=login.js.map
