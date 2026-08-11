// apps/backend/src/routes/aiGatewayRoutes.js

import express from 'express';
import {
  searchProductByName,
  getCustomerHistoryByPhone,
  createQuotationForAI,
  getProductStock
} from '../controllers/aiGatewayController.js';
import { protectAIGateway } from '../middleware/authmiddleware.js'; // AI के लिए नया, सुरक्षित middleware

const router = express.Router();

// यह एक सीक्रेट API Key से सुरक्षित है ताकि केवल आपका व्हाट्सएप कंट्रोलर ही इसे एक्सेस कर सके
router.use(protectAIGateway);

// AI की क्षमताओं के अनुसार रूट्स
router.get('/products/search', searchProductByName);
router.get('/products/stock', getProductStock);
router.get('/customers/history', getCustomerHistoryByPhone);
router.post('/quotations/create', createQuotationForAI);

export default router;
