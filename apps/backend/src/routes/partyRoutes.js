import express from "express";
import { createParty, listParties, getPartyById, updateParty, deleteParty, getPartyStatement, getPartyQuickSummary, attachPartyTransactionImage } from "../controllers/partyController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.post("/", createParty);
router.get("/", listParties);
router.post("/attach-image", attachPartyTransactionImage);
router.get("/:id/quick-summary", getPartyQuickSummary);
router.get("/:id/statement", getPartyStatement);
router.get("/:id", getPartyById);
router.put("/:id", updateParty);
router.delete("/:id", deleteParty);

export default router;
