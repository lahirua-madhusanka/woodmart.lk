import { body } from "express-validator";
import express from "express";
import {
  createAdminCategory,
  deleteAdminCategory,
  deleteUserAdmin,
  getAdminCategories,
  getAdminDashboardStats,
  getAdminReviews,
  getAllOrdersAdmin,
  getAllUsersAdmin,
  updateOrderStatusAdmin,
  updateUserRoleAdmin,
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminDashboardStats);

router.get("/orders", getAllOrdersAdmin);
router.put(
  "/orders/:id/status",
  [
    body("orderStatus")
      .optional()
      .isIn(["created", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid order status"),
    body("paymentStatus")
      .optional()
      .isIn(["pending", "paid", "failed"])
      .withMessage("Invalid payment status"),
  ],
  validateRequest,
  updateOrderStatusAdmin
);

router.get("/users", getAllUsersAdmin);
router.put(
  "/users/:id/role",
  [
    body("role")
      .isIn(["user", "admin"])
      .withMessage("Role must be user or admin"),
  ],
  validateRequest,
  updateUserRoleAdmin
);
router.delete("/users/:id", deleteUserAdmin);

router.get("/categories", getAdminCategories);
router.post(
  "/categories",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Category name is required")
      .isLength({ max: 80 })
      .withMessage("Category name must be at most 80 characters"),
  ],
  validateRequest,
  createAdminCategory
);
router.delete("/categories/:id", deleteAdminCategory);
router.get("/reviews", getAdminReviews);

export default router;
