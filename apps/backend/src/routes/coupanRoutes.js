import express from "express";
import { addCoupan, listCoupans } from "../controllers/coupanController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addCoupan).get(protect, listCoupans);

export default router;