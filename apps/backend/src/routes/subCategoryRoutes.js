import express from "express";
import { createSubCategory, listSubCategories, updateSubCategory, deleteSubCategory } from "../controllers/subCategoryController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.post("/", createSubCategory);
router.get("/", listSubCategories);
router.put("/:id", updateSubCategory);
router.delete("/:id", deleteSubCategory);

export default router;