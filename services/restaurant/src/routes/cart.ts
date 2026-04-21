import { Router } from "express";
import { addToCart, fetchMyCart } from "../controllers/cart.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/add", isAuth, addToCart);
router.get("/all", isAuth, fetchMyCart);

export default router;
