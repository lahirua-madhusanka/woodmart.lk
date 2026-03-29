import { body } from "express-validator";
import express from "express";
import { getProfile, loginUser, logoutUser, registerUser, registerAdmin } from "../controllers/authController.js";
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

router.get("/profile", protect, getProfile);
router.post("/logout", protect, logoutUser);

export default router;
