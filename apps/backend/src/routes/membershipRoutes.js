import express from "express";
import { addMembership, listMemberships } from "../controllers/membershipController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addMembership).get(protect, listMemberships);

export default router;