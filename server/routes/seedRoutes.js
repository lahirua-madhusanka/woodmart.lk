import express from "express";
import { seedProducts } from "../controllers/seedController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/products", protect, adminOnly, seedProducts);

export default router;
