import { body, param } from "express-validator";
import express from "express";
import {
  createOrderProductReview,
  getMyReviewItems,
  getOrderReviewItems,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/mine", getMyReviewItems);

router.get(
  "/order/:orderId",
  [param("orderId").trim().notEmpty().withMessage("Order ID is required")],
  validateRequest,
  getOrderReviewItems
);

router.post(
  "/",
  [
    body("orderId").trim().notEmpty().withMessage("Order ID is required"),
    body("productId").trim().notEmpty().withMessage("Product ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validateRequest,
  createOrderProductReview
);

export default router;
