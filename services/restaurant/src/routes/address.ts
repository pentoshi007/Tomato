import { Router } from "express";
import {
  addAddress,
  deleteAddress,
  getAddresses,
} from "../controllers/address.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = Router();

router.post("/new", isAuth, addAddress);
router.delete("/delete/:addressId", isAuth, deleteAddress);
router.get("/get", isAuth, getAddresses);

export default router;
