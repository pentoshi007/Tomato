import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface IUser {
    _id: string;
    email: string;
    name: string;
    image: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

type AuthTokenPayload = JwtPayload & {
    user?: string | IUser;
};

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

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthTokenPayload;
        if (!decoded || !decoded.user) {
            res.status(401).json({ message: "Unauthorized, invalid token" });
            return;
        }
        req.user = typeof decoded.user === "string" ? ({ _id: decoded.user } as IUser) : decoded.user;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: (error as Error).message });
        next(error);
    }
}

export const isSeller = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user || user.role !== "seller") {
        res.status(403).json({ message: "Unauthorized, you are not a seller" });
        return;
    }
    next();
}

