import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import restaurantRoutes from "./routes/restaurant.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/restaurant", restaurantRoutes);

async function startServer() {
  try {
    await connectDB();
    app.listen(process.env.PORT || 3001, () => {
      console.log(
        `Restaurant service is running on port ${process.env.PORT || 3001}`,
      );
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

startServer();
