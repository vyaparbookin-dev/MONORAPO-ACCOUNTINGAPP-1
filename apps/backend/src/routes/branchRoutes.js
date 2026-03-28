import express from "express";
import { addBranch, listBranches, getBranch } from "../controllers/branchController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();
router.route("/").post(protect, addBranch).get(protect, listBranches);
router.route("/:id").get(protect, getBranch);
export default router;