import express from "express";
import { getDayBook } from "../controllers/daybookController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", protect, getDayBook);

export default router;