import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/cart", cartRoutes);
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
