import express from "express";
import { addCapitalEntry, getCapitalSummary, deleteCapitalEntry } from "../controllers/capitalController.js";
import { authenticateToken } from "../middleware/authmiddleware.js";
import { companyMiddleware } from "../middleware/companyMiddleware.js";

const router = express.Router();

router.use(authenticateToken);
router.use(companyMiddleware);

router.post("/", addCapitalEntry);
router.get("/", getCapitalSummary);
router.delete("/:id", deleteCapitalEntry);

export default router;
