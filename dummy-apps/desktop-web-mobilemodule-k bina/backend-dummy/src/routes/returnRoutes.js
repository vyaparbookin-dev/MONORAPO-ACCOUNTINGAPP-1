import express from "express";
import { createReturn, getReturns } from "../controllers/returnController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createReturn);
router.get("/", protect, getReturns);

export default router;