import express from "express";
import { getHomepageData } from "../controllers/homepageDataController.js";

const router = express.Router();

router.get("/", getHomepageData);

export default router;
