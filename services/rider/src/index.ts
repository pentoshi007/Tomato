import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import riderRoutes from "./routes/rider.js";
import { connectToRabbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/orderReady.consumer.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("ok");
});

app.use("/api/rider", riderRoutes);

async function bootstrap() {
  await connectDB();
  await connectToRabbitMQ();
  await startOrderReadyConsumer();
}

async function startServer() {
  try {
    await bootstrap();
    app.listen(process.env.PORT || 3003, () => {
      console.log(
        `Rider Server is running on port ${process.env.PORT || 3003}`,
      );
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

export default app;

if (process.env.VERCEL && !process.env.PORT) {
  bootstrap().catch((error) => console.log("bootstrap failed", error));
} else {
  void startServer();
}
