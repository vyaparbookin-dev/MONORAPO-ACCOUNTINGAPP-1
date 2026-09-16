import express from "express";
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  addAccountTransaction,
} from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getBankAccounts).post(createBankAccount);
router.route("/:id").put(updateBankAccount).delete(deleteBankAccount);
router.route("/:id/transaction").post(addAccountTransaction);

export default router;
