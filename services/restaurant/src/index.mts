import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import { connectToRabbitMQ } from "./config/rabbitmq.js";
import { consumePaymentEvents } from "./config/payment.consumer.js";
import { resumeDemoKitchens } from "./config/demoKitchen.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("ok");
});
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
async function bootstrap() {
  await connectDB();
  await connectToRabbitMQ();
  await consumePaymentEvents();
  await resumeDemoKitchens().catch((error) =>
    console.log("demo kitchen resume failed", error),
  );
}

async function startServer() {
  try {
    await bootstrap();
    app.listen(process.env.PORT || 3002, () => {
      console.log(
        `Restaurant service is running on port ${process.env.PORT || 3002}`,
      );
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
  void startServer();
}
