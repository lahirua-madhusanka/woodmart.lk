import { body } from "express-validator";
import express from "express";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  getActivePromotionBySlug,
  getActivePromotions,
  getAdminPromotionById,
  getAdminPromotions,
  replaceAdminPromotionProducts,
  updateAdminPromotion,
} from "../controllers/promotionController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.get("/", getActivePromotions);
router.get("/:slug", getActivePromotionBySlug);

router.use("/admin", protect, adminOnly);

router.get("/admin/list", getAdminPromotions);
router.get("/admin/:id", getAdminPromotionById);
router.post(
  "/admin",
  [
    body("title").trim().notEmpty().isLength({ max: 180 }),
    body("slug").optional({ nullable: true }).trim().isLength({ max: 120 }),
    body("description").optional({ nullable: true }).isLength({ max: 1000 }),
    body("status").optional().isIn(["active", "inactive"]),
    body("startDate").optional({ nullable: true, checkFalsy: true }).isISO8601(),
    body("endDate").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  ],
  validateRequest,
  createAdminPromotion
);

router.put(
  "/admin/:id",
  [
    body("title").trim().notEmpty().isLength({ max: 180 }),
    body("slug").optional({ nullable: true }).trim().isLength({ max: 120 }),
    body("description").optional({ nullable: true }).isLength({ max: 1000 }),
    body("status").optional().isIn(["active", "inactive"]),
    body("startDate").optional({ nullable: true, checkFalsy: true }).isISO8601(),
    body("endDate").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  ],
  validateRequest,
  updateAdminPromotion
);

router.put(
  "/admin/:id/products",
  [
    body("products").isArray(),
    body("products.*.productId").isUUID(),
    body("products.*.discountPercentage").isFloat({ min: 0.01, max: 95 }),
  ],
  validateRequest,
  replaceAdminPromotionProducts
);

router.delete("/admin/:id", deleteAdminPromotion);

export default router;
