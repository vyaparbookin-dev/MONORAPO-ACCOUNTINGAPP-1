// apps/backend/src/routes/aiGatewayRoutes.js

import express from 'express';
import {
  searchProductByName,
  getCustomerHistoryByPhone,
  createQuotationForAI,
  getProductStock
} from '../controllers/aiGatewayController.js';
import { protect } from '../middleware/authmiddleware.js'; // सुरक्षा के लिए

const router = express.Router();

// यह एक API Key या किसी अन्य तरीके से सुरक्षित होना चाहिए ताकि केवल आपका AI ही इसे एक्सेस कर सके
// अभी के लिए हम protect middleware का उपयोग कर रहे हैं
router.use(protect); // या एक कस्टम AI-specific middleware बनाएं

// AI की क्षमताओं के अनुसार रूट्स
router.get('/products/search', searchProductByName);
router.get('/products/stock', getProductStock);
router.get('/customers/history', getCustomerHistoryByPhone);
router.post('/quotations/create', createQuotationForAI);

export default router;
