import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("ok");
});

app.use("/api/v1", adminRoutes);


const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Admin server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start admin service", error);
    process.exit(1);
  }
};

export default app;

if (!process.env.VERCEL) {
  void startServer();
}
