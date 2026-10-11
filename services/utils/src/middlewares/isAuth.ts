import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

type Role = "customer" | "rider" | "seller" | "admin";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    role: Role;
  };
}

type AuthTokenPayload = JwtPayload & {
  user?: unknown;
  role?: unknown;
};

const validRoles: ReadonlySet<Role> = new Set([
  "customer",
  "rider",
  "seller",
  "admin",
]);

export const isAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized, no token provided" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    res.status(401).json({ message: "Unauthorized, no token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    if (
      typeof decoded.user !== "string" ||
      decoded.user.length === 0 ||
      typeof decoded.role !== "string" ||
      !validRoles.has(decoded.role as Role)
    ) {
      res.status(401).json({ message: "Unauthorized, invalid token" });
      return;
    }

    req.user = { _id: decoded.user, role: decoded.role as Role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Unauthorized, invalid token" });
      return;
    }
    next(error);
  }
};
