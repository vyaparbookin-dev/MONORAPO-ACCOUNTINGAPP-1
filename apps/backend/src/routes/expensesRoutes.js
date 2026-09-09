import express from "express";
import { addExpense, listExpenses, deleteExpense, getExpenseById, updateExpense, getGharKharchSummary } from "../controllers/expensesController.js";
import { protect, requireCompany } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { expenseSchema } from "../utils/validators.js";

const router = express.Router();

router.use(protect);
router.use(requireCompany);

// Specific summary routes before /:id
router.get("/ghar-kharch-summary", getGharKharchSummary);

router.route("/").post(validateRequest(expenseSchema), addExpense).get(listExpenses);
router.route("/:id").get(getExpenseById).put(updateExpense).delete(deleteExpense);

export default router;
