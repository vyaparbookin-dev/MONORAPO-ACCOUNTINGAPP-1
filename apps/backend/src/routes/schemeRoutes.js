import express from "express";
import { addScheem, listScheems } from "../controllers/schemeController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addScheem).get(protect, listScheems);

export default router;