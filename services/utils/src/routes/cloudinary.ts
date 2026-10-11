import { Router } from "express";
import cloudinary from "cloudinary";
import { isInternalService } from "../middlewares/internalAuth.js";

const router = Router();

router.post("/upload", isInternalService, async (req, res) => {
  try {
    const { buffer } = req.body as { buffer?: unknown };
    if (typeof buffer !== "string" || buffer.length === 0) {
      return res.status(400).json({ message: "File buffer is required" });
    }
    const cloud = await cloudinary.v2.uploader.upload(buffer);
    return res
      .status(200)
      .json({ message: "File uploaded successfully", url: cloud.secure_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return res.status(500).json({ message });
  }
});

export default router;
