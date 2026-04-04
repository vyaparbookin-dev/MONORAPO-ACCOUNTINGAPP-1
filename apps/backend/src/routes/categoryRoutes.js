import express from "express";
import { createCategory, listCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.post("/", createCategory);
router.get("/", listCategories);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
