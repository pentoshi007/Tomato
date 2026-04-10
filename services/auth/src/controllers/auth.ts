import jwt from "jsonwebtoken";
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import User from "../model/User.js";
import TryCatch from "../middlewares/trycatch.js";
import oauth2Client from "../config/googleConfig.js";
import axios from "axios";
export const loginUser = TryCatch(async (req, res) => {
    const { code } = req.body as { code: string };
    if (!code) {
        return res.status(400).json({ message: "Authorization code is required." });
    }
   const googleRes= await oauth2Client.getToken(code);
   oauth2Client.setCredentials(googleRes.tokens);
   const userRes= await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);


    // const { email, name, picture } = req.body as { email: string; name: string; picture: string };
    const { email, name, picture } = userRes.data;
    // Check for required fields
    if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required." });
    }
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({ email, name, image: picture });
    }
    const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET as string, { expiresIn: "15d" });
    res.status(200).json({ user, message: "User logged in successfully", token });
});
// The following defines which user roles are permitted in the system.
// "allowedRoles" is a constant array containing all valid role strings: "customer", "rider", and "seller".
// The 'as const' assertion ensures these are treated as literal types, enabling strong type checking.
// The "Role" type is a union type which can be either "customer", "rider", or "seller".
// This makes it easy to restrict variables or parameters to these valid roles.
const allowedRoles = ["customer", "rider", "seller"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole=TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized, no user found" });
        return;
    }
   const { role } = req.body as { role: Role };
   if (!allowedRoles.includes(role)) {
    res.status(401).json({ message: "Unauthorized, invalid role" });
    return;
   }
   const user = await User.findByIdAndUpdate(req.user._id, { role }, {
      returnDocument: "after",
   });
   // returnDocument: "after" returns the document after the update (replaces deprecated new: true).
   if (!user) {
    res.status(401).json({ message: "Unauthorized, user not found" });
    return;
   }
   const token = jwt.sign({ user: user._id }, process.env.JWT_SECRET as string, { expiresIn: "15d" });
   res.status(200).json({ user, message: "User role updated successfully", token });
   req.user = user;
   next();
})

export const myProfile=TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {

    if (!req.user) {
        res.status(401).json({ message: "Unauthorized, no user found" });
        return;
    }
    res.status(200).json({ user: req.user });
    next();
})



