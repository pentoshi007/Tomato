import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("ok");
});

app.use("/api/auth", authRoutes);

async function bootstrap() {
  await connectDB();
}

async function startServer() {
  try {
    await bootstrap();
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Auth Server is running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

export default app;

if (process.env.VERCEL) {
  bootstrap().catch((error) => console.log("bootstrap failed", error));
} else {
  startServer();
}
