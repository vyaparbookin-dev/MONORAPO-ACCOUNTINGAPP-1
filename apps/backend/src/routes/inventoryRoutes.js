import express from "express";
import { addProduct, listProducts, getProductById, updateProduct, deleteProduct, adjustStock, getStockAdjustments, updateStock, getProductByBarcode, getInventorySummary, addPurchaseEntry } from "../controllers/inventoryController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Custom inventory actions
router.post("/purchase", protect, addPurchaseEntry);
router.post("/adjust", protect, adjustStock);
router.get("/adjustments", protect, getStockAdjustments);
router.get("/summary", protect, getInventorySummary);
router.get("/barcode", protect, getProductByBarcode);
router.patch("/:id/stock", protect, updateStock);

// Standard CRUD operations
router.route("/")
  .post(protect, addProduct)
  .get(protect, listProducts);

router.route("/:id")
  .get(protect, getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

export default router;