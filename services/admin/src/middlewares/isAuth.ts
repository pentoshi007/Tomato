import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { getUserCollection } from "../utils/collections.js";

interface AuthenticatedUser {
  _id: string;
  email: string;
  name: string;
  image: string;
  role: string;
  restaurantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (typeof decoded.user !== "string" || !ObjectId.isValid(decoded.user)) {
      res.status(401).json({ message: "Unauthorized, invalid token" });
      return;
    }

    const users = await getUserCollection();
    const user = await users.findOne({ _id: new ObjectId(decoded.user) });
    if (!user) {
      res.status(401).json({ message: "Unauthorized, user not found" });
      return;
    }

    if (
      typeof user.email !== "string" ||
      typeof user.name !== "string" ||
      typeof user.image !== "string" ||
      typeof user.role !== "string"
    ) {
      res.status(401).json({ message: "Unauthorized, invalid user" });
      return;
    }

    const authenticatedUser: AuthenticatedUser = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    };
    if (user.restaurantId) {
      authenticatedUser.restaurantId = user.restaurantId.toString();
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

export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Please log in" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ message: "Access denied, admins only" });
    return;
  }

  next();
};
