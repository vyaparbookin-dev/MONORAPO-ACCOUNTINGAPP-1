import express from 'express';
import { createPurchaseOrder, getPurchaseOrders } from '../controllers/purchaseOrderController.js';
import { protect, requireCompany } from '../middleware/authmiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect, requireCompany);

router.route('/')
  .post(authorizeRoles('owner', 'manager'), createPurchaseOrder)
  .get(authorizeRoles('owner', 'manager'), getPurchaseOrders);

export default router;