import express from "express";
import { createBackup } from "../controllers/cloudController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/backup", protect, createBackup);

export default router;