import express from "express";
import { addLaterpad, listLaterpads } from "../controllers/laterpadController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addLaterpad).get(protect, listLaterpads);

export default router;