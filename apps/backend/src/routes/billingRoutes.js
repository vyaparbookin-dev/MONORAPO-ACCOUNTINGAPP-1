import express from "express";
import { createBill, listBills, getBillById, updateBill, deleteBill, parseBillImage, createNonGstBill, addDispatchRecord, importBills, downloadBillPDF, exportBillsCSV } from "../controllers/billingController.js";
import { protect } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { createBillSchema } from "../utils/validators.js";

const router = express.Router();

router.route("/").post(protect, validateRequest(createBillSchema), createBill).get(protect, listBills);

// GET /api/billing/export/csv - Download all bills as CSV
router.get("/export/csv", protect, exportBillsCSV);

router.route("/:id").get(protect, getBillById).put(protect, updateBill).delete(protect, deleteBill);

// GET /api/billing/pdf/:id - Download bill as PDF
router.get("/pdf/:id", protect, downloadBillPDF);

// POST /api/billing/parse-image - accepts JSON { image: base64 }
router.post("/parse-image", protect, parseBillImage);
router.post("/nongst", protect, createNonGstBill);
router.post("/dispatch", protect, addDispatchRecord);
router.post("/import", protect, importBills); // Note: Should handle multipart/form-data via multer if needed

export default router;