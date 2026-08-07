import express from "express";
import { addScheme, listSchemes } from "../controllers/schemeController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addScheme).get(protect, listSchemes);

export default router;