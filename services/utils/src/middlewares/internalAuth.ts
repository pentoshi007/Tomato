import type { NextFunction, Request, Response } from "express";

export const isInternalService = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const configuredKey = process.env.INTERNAL_SERVICE_KEY;
  if (!configuredKey) {
    res.status(503).json({ message: "Internal service authentication unavailable" });
    return;
  }

  if (req.get("x-internal-key") !== configuredKey) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};
