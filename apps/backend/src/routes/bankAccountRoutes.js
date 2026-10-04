import express from "express";
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  addAccountTransaction,
  addMonthlyInterest,
  transferFunds,
} from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getBankAccounts).post(createBankAccount);
router.post("/transfer", transferFunds);
router.route("/:id").put(updateBankAccount).delete(deleteBankAccount);
router.route("/:id/transaction").post(addAccountTransaction);
router.route("/:id/transactions").post(addAccountTransaction);
router.route("/:id/interest").post(addMonthlyInterest);

export default router;

