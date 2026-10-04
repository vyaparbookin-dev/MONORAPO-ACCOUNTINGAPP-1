import express from "express";
import { uploadBillPhoto, deleteBillPhoto } from "../controllers/uploadController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/bill-image", uploadBillPhoto);
router.post("/delete-bill-image", deleteBillPhoto);

export default router;
