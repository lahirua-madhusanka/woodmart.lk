import { body } from "express-validator";
import express from "express";
import {
  createOrder,
  createPaymentIntent,
  getOrderById,
  getUserOrders,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/create-payment-intent",
  [body("amount").isFloat({ min: 1 }).withMessage("Amount must be greater than zero")],
  validateRequest,
  createPaymentIntent
);

router.post(
  "/create",
  [
    body("shippingAddress.fullName").notEmpty().withMessage("Full name is required"),
    body("shippingAddress.line1").notEmpty().withMessage("Address line is required"),
    body("shippingAddress.city").notEmpty().withMessage("City is required"),
    body("shippingAddress.postalCode").notEmpty().withMessage("Postal code is required"),
    body("shippingAddress.country").notEmpty().withMessage("Country is required"),
    body("shippingAddress.phone").notEmpty().withMessage("Phone number is required"),
  ],
  validateRequest,
  createOrder
);

router.get("/user", getUserOrders);
router.get("/:id", getOrderById);

export default router;
