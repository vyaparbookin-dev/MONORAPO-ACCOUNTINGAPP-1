import express from "express";
import { createPurchaseOrder, getPurchaseOrders, updateOrderStatus } from "../controllers/purchaseOrderController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createPurchaseOrder);
router.get("/", protect, getPurchaseOrders);
router.patch("/:id/status", protect, updateOrderStatus);

export default router;