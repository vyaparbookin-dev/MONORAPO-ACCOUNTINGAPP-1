import express from "express";
import { getPendingApprovals, updateApprovalStatus } from "../controllers/approvalController.js";
import { protect } from "../middleware/authmiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles('admin', 'manager'), getPendingApprovals);
router.post("/update", protect, authorizeRoles('admin', 'manager'), updateApprovalStatus);

export default router;