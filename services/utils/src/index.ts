import express from "express";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import cors from "cors";
import uploadRoutes from "./routes/cloudinary.js";
import { connectToRabbitMQ } from "./config/rabbitmq.js";
import paymentRoutes from "./routes/payment.js";
import geocodeRoutes from "./routes/geocode.js";
dotenv.config();
connectToRabbitMQ();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cors());
app.get("/", (_req, res) => {
  res.send("ok");
});

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
  throw new Error("Cloudinary credentials are not set");
}

cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
});

app.use("/api", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/geocode", geocodeRoutes);
function startServer() {
  try {
    app.listen(process.env.PORT || 3004, () => {
      console.log(
        `Utils service is running on port ${process.env.PORT || 3004}`,
      );
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
