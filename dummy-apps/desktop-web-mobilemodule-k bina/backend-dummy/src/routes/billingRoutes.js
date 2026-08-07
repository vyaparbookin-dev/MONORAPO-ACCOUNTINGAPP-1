import express from "express";
import { createBill, listBills, getBillById, updateBill, deleteBill, parseBillImage, createNonGstBill, addDispatchRecord, importBills, downloadBillPDF, exportBillsCSV } from "../controllers/billingController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { createBillSchema } from "../utils/validators.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.route("/").post(validateRequest(createBillSchema), createBill).get(listBills);

// GET /api/billing/export/csv - Download all bills as CSV
router.get("/export/csv", exportBillsCSV);

router.route("/:id").get(getBillById).put(updateBill).delete(deleteBill);

// GET /api/billing/pdf/:id - Download bill as PDF
router.get("/pdf/:id", downloadBillPDF);

// POST /api/billing/parse-image - accepts JSON { image: base64 }
router.post("/parse-image", parseBillImage);
router.post("/nongst", createNonGstBill);
router.post("/dispatch", addDispatchRecord);
router.post("/import", importBills); // Note: Should handle multipart/form-data via multer if needed

export default router;