import express from "express";
import { createBrand, listBrands, updateBrand, deleteBrand } from "../controllers/brandController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.post("/", createBrand);
router.get("/", listBrands);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;