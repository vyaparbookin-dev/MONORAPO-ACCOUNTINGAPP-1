import express from "express";
import { 
  createStaff, 
  listStaff, 
  getStaffById, 
  updateStaff, 
  deleteStaff, 
  deleteStaffTransaction, 
  addPayment, 
  markAttendance, 
  getStaffStatement,
  getPagarBookSummary,
  quickMarkAttendance,
  addStaffAdvance,
  addStaffOvertime,
  addStaffCommission
} from "../controllers/staffController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

// SAAS LOCK
router.use(protect);
router.use(requireCompany);

// PagarBook APIs
router.get("/pagarbook-summary", getPagarBookSummary);
router.post("/quick-attendance", quickMarkAttendance);
router.post("/advance", addStaffAdvance);
router.post("/overtime", addStaffOvertime);
router.post("/commission", addStaffCommission);

router.post("/", createStaff);
router.get("/", listStaff);
router.post("/payment", addPayment);
router.post("/attendance", markAttendance);
router.get("/:id/statement", getStaffStatement);
router.get("/:id", getStaffById);
router.put("/:id", updateStaff);
router.delete("/transaction/:id", deleteStaffTransaction);
router.delete("/:id", deleteStaff);

export default router;
