import express from "express";
import { createDocument, getDocuments, convertToInvoice } from "../controllers/b2bController.js";
import { protect } from "../middleware/authmiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Only admin and manager can create documents
router.post("/", protect, authorizeRoles("admin", "manager"), createDocument);
router.get("/", protect, getDocuments);
// Only admin and manager can convert documents to final bills
router.post("/:id/convert", protect, authorizeRoles("admin", "manager"), convertToInvoice);

export default router;