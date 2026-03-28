import express from "express";
import { createCategory, listCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", listCategories);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
