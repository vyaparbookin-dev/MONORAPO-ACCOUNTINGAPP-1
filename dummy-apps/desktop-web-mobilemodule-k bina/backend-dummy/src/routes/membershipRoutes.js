import express from "express";
import { addMembership, listMemberships, getMembershipById, updateMembership, deleteMembership } from "../controllers/membershipController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addMembership).get(protect, listMemberships);
router.route("/:id").get(protect, getMembershipById).put(protect, updateMembership).delete(protect, deleteMembership);

export default router;