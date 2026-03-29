import { body } from "express-validator";
import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getWishlist);

router.post(
  "/add",
  [body("productId").isUUID().withMessage("Valid productId is required")],
  validateRequest,
  addToWishlist
);

router.delete(
  "/remove",
  [body("productId").isUUID().withMessage("Valid productId is required")],
  validateRequest,
  removeFromWishlist
);

export default router;
