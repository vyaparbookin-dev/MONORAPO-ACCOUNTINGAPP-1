import express from "express";
import { addExpance, listExpances, deleteExpance } from "../controllers/expanceController.js";
import { protect } from "../middleware/authmiddleware.js";
import { validateRequest } from "../middleware/validateData.js";
import { expenseSchema } from "../utils/validators.js";

const router = express.Router();

router.route("/").post(protect, validateRequest(expenseSchema), addExpance).get(protect, listExpances);
router.route("/:id").delete(protect, deleteExpance);

// You can later add: update, filter by date/category
// router.put("/update/:id", protect, updateExpance);

export default router;