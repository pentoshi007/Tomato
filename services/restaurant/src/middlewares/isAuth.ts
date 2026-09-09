import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

type Role = "customer" | "rider" | "seller" | "admin";

interface AuthenticatedUser {
  _id: string;
  role: Role;
  restaurantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

type AuthTokenPayload = JwtPayload & {
  user?: unknown;
  role?: unknown;
  restaurantId?: unknown;
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
  if (!token) {
    res.status(401).json({ message: "Unauthorized, no token provided" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    res.status(500).json({ message: "Internal server error" });
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

    const authenticatedUser: AuthenticatedUser = {
      _id: decoded.user,
      role: decoded.role as Role,
    };
    if (typeof decoded.restaurantId === "string") {
      authenticatedUser.restaurantId = decoded.restaurantId;
    }

    req.user = authenticatedUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Unauthorized, invalid token" });
      return;
    }

    console.error(error);
    next(error);
  }
};

export const isSeller = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "seller") {
    res.status(403).json({ message: "Unauthorized, you are not a seller" });
    return;
  }

  next();
};
