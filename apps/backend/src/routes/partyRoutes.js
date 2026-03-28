import express from "express";
import { createParty, listParties, getPartyById, updateParty, deleteParty, getPartyStatement } from "../controllers/partyController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createParty);
router.get("/", protect, listParties);
router.get("/:id/statement", protect, getPartyStatement);
router.get("/:id", protect, getPartyById);
router.put("/:id", protect, updateParty);
router.delete("/:id", protect, deleteParty);

export default router;
