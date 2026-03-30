import { body } from "express-validator";
import express from "express";
import {
  changePassword,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
  registerAdmin,
  resendVerificationEmail,
  updateProfile,
  verifyEmail,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  loginUser
);

router.post(
  "/admin/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  registerAdmin
);

router.get("/verify-email", verifyEmail);
router.post("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  resendVerificationEmail
);

router.get("/profile", protect, getProfile);
router.put(
  "/profile",
  protect,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validateRequest,
  updateProfile
);
router.put(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  validateRequest,
  changePassword
);
router.post("/logout", protect, logoutUser);

export default router;
