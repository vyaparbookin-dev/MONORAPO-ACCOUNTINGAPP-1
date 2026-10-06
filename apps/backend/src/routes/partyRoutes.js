import express from "express";
import {
  createParty,
  bulkCreateParties,
  listParties,
  getPartyById,
  updateParty,
  deleteParty,
  getPartyStatement,
  getPartyQuickSummary,
  attachPartyTransactionImage,
  deletePartyTransaction,
  updatePartyTransaction,
  clearPartyBalance,
  syncPartyBalance
} from "../controllers/partyController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.post("/bulk-create", bulkCreateParties);
router.post("/", createParty);
router.get("/", listParties);
router.post("/attach-image", attachPartyTransactionImage);
router.delete("/transaction/:id", deletePartyTransaction);
router.put("/transaction/:id", updatePartyTransaction);
router.post("/:id/clear-balance", clearPartyBalance);
router.post("/:id/sync-balance", syncPartyBalance);
router.get("/:id/quick-summary", getPartyQuickSummary);
router.get("/:id/statement", getPartyStatement);
router.get("/:id", getPartyById);
router.put("/:id", updateParty);
router.delete("/:id", deleteParty);


export default router;
