import type { Request } from "express";

export const isInternalRequest = (req: Request): boolean => {
  const configuredKey = process.env.INTERNAL_SERVICE_KEY;
  const providedKey = req.get("x-internal-key");
  return Boolean(configuredKey && providedKey === configuredKey);
};
