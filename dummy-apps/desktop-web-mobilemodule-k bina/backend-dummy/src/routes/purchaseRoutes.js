import express from "express";
import { createPurchase, getPurchases, getPurchaseById, exportPurchasesCSV, deletePurchase } from "../controllers/purchaseController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { createPurchaseSchema } from "../utils/validators.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.route("/")
  .post(validateRequest(createPurchaseSchema), createPurchase)
  .get(getPurchases);

// Export route (Must be above /:id)
router.get("/export/csv", exportPurchasesCSV);

router.route("/:id")
  .get(getPurchaseById)
  .delete(deletePurchase);

export default router;