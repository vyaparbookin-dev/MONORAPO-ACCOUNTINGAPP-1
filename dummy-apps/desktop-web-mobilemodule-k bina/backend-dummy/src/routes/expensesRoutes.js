import express from "express";
import { addExpense, listExpenses, deleteExpense, getExpenseById, updateExpense } from "../controllers/expensesController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { expenseSchema } from "../utils/validators.js";

const router = express.Router();

// 🚀 SAAS LOCK
router.use(protect);
router.use(requireCompany);

router.route("/").post(validateRequest(expenseSchema), addExpense).get(listExpenses);
router.route("/:id").get(getExpenseById).put(updateExpense).delete(deleteExpense);

// You can later add: update, filter by date/category
// router.put("/update/:id", protect, updateExpance);

export default router;