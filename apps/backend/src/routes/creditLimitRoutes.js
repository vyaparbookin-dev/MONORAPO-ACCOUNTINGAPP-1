import express from "express";
import { protect as authenticateUser } from "../middleware/authmiddleware.js";
import {
  sanctionCreditLimit,
  verifyCreditLimitSanction,
  resendBillApprovalOtp,
  unlockCreditLimit,
  getCreditLimitParties
} from "../controllers/creditLimitController.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/parties", getCreditLimitParties);
router.post("/sanction-request", sanctionCreditLimit);
router.post("/verify-sanction", verifyCreditLimitSanction);
router.post("/resend-approval", resendBillApprovalOtp);
router.post("/unlock", unlockCreditLimit);

export default router;
