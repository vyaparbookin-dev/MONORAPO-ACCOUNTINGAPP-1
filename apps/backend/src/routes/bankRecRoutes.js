import express from "express";
import { 
  reconcileStatement, 
  postMissingEntry, 
  getBankFeeds, 
  saveReconciliationReport 
} from "../controllers/bankRecController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/reconcile", reconcileStatement);
router.post("/post-entry", postMissingEntry);
router.get("/feeds", getBankFeeds);
router.get("/feeds/:accountId", getBankFeeds);
router.post("/save-report", saveReconciliationReport);

export default router;
