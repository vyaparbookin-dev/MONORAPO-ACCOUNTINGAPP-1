import express from "express";
import { addCapitalEntry, getCapitalSummary, deleteCapitalEntry } from "../controllers/capitalController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addCapitalEntry);
router.get("/", getCapitalSummary);
router.delete("/:id", deleteCapitalEntry);

export default router;
