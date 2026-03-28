import express from "express";
import { createPurchase, getPurchases, getPurchaseById, exportPurchasesCSV, deletePurchase } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { createPurchaseSchema } from "../utils/validators.js";

const router = express.Router();

router.route("/")
  .post(protect, validateRequest(createPurchaseSchema), createPurchase)
  .get(protect, getPurchases);

// Export route (Must be above /:id)
router.get("/export/csv", protect, exportPurchasesCSV);

router.route("/:id")
  .get(protect, getPurchaseById)
  .delete(protect, deletePurchase); // Soft delete route added

export default router;