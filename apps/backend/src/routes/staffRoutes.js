import express from "express";
import { createStaff, listStaff, getStaffById, updateStaff, deleteStaff, addPayment, markAttendance, getStaffStatement } from "../controllers/staffController.js";

const router = express.Router();

router.post("/", createStaff);
router.get("/", listStaff);
router.post("/payment", addPayment);
router.post("/attendance", markAttendance);
router.get("/:id/statement", getStaffStatement);
router.get("/:id", getStaffById);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
