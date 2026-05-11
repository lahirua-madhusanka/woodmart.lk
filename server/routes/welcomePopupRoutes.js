import express from "express";
import { getWelcomePopup } from "../controllers/welcomePopupController.js";

const router = express.Router();

router.get("/", getWelcomePopup);

export default router;
