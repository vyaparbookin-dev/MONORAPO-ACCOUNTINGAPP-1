import express from "express";
import { addExpance, listExpances, deleteExpance } from "../controllers/expanceController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { expenseSchema } from "../utils/validators.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.route("/").post(validateRequest(expenseSchema), addExpance).get(listExpances);
router.route("/:id").delete(deleteExpance);

// You can later add: update, filter by date/category
// router.put("/update/:id", protect, updateExpance);

export default router;