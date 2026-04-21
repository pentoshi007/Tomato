import { Router } from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  addMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
} from "../controllers/menuitem.js";
import { getAllItems } from "../controllers/menuitem.js";
import uploadFile from "../middlewares/multer.js";

const router = Router();
router.post("/new", isAuth, isSeller, uploadFile, addMenuItem);
router.get("/all/:id", isAuth, getAllItems);
router.delete("/:itemId", isAuth, isSeller, deleteMenuItem);
router.put("/status/:itemId", isAuth, isSeller, toggleMenuItemAvailability);
export default router;
