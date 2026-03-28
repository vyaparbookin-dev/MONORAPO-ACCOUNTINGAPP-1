import express from "express";
import { createOrder, verifyPayment, addPaymentEntry, addBulkPaymentEntry, parseStatementImage } from "../controllers/paymentController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

// Khata / Udhar-Jama routes
router.post("/entry", protect, addPaymentEntry);
router.post("/bulk-entry", protect, addBulkPaymentEntry);

// OCR Route for Statements
router.post("/parse-statement", protect, parseStatementImage);

export default router;