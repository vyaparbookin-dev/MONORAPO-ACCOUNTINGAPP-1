import express from "express";
import { getUdharEntriesForParty, createConsolidatedStatement, getConsolidatedStatementById, getConsolidatedStatementsForParty } from "../controllers/consolidatedStatementController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createConsolidatedStatement);
router.get("/party/:partyId/udhar", protect, getUdharEntriesForParty);
router.get("/party/:partyId", protect, getConsolidatedStatementsForParty);
router.get("/:statementId", protect, getConsolidatedStatementById);

export default router;
