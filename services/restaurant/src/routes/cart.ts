import { Router } from "express";
import {
  addToCart,
  decrementCartItem,
  fetchMyCart,
  incrementCartItem,
  clearCart,
} from "../controllers/cart.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/add", isAuth, addToCart);
router.get("/all", isAuth, fetchMyCart);
router.put("/incr", isAuth, incrementCartItem);
router.put("/decr", isAuth, decrementCartItem);
router.delete("/clear", isAuth, clearCart);

export default router;
