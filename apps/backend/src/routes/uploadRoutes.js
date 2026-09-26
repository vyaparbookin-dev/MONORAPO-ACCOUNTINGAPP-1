import express from "express";
import { uploadBillPhoto } from "../controllers/uploadController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/bill-image", uploadBillPhoto);

export default router;
