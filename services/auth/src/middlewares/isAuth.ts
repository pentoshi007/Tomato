import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import type { IUser } from "../model/User.js";
import User from "../model/User.js";
import TryCatch from "./trycatch.js";

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
             res.status(401).json({ message: "Unauthorized, no token provided" });
             return;
        }


        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized, no token provided" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        if (!decoded || !decoded.user) {
            res.status(401).json({ message: "Unauthorized, invalid token" });
            return;
        }
        const user = await User.findById(decoded.user);
        if (!user) {
            res.status(401).json({ message: "Unauthorized, user not found" });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: (error as Error).message });
        next(error);
    }
}

