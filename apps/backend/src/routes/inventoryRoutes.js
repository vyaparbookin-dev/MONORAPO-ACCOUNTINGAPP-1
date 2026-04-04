import express from "express";
import { addProduct, listProducts, getProductById, updateProduct, deleteProduct, adjustStock, getStockAdjustments, updateStock, getProductByBarcode, getInventorySummary, addPurchaseEntry, bulkImportProducts } from "../controllers/inventoryController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

// 🚀 SAAS LOCK: Protect all routes and STRICTLY require a Company ID
router.use(protect);
router.use(requireCompany);

// Custom inventory actions
router.post("/import", bulkImportProducts);
router.post("/purchase", addPurchaseEntry);
router.post("/adjust", adjustStock);
router.get("/adjustments", getStockAdjustments);
router.get("/summary", getInventorySummary);
router.get("/barcode", getProductByBarcode);
router.patch("/:id/stock", updateStock);

// Standard CRUD operations
router.route("/")
  .post(addProduct)
  .get(listProducts);

router.route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;