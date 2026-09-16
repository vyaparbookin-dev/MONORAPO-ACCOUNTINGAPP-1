import express from "express";
import {
  getSavings,
  createSavings,
  updateSavings,
  deleteSavings,
  addInstallment,
} from "../controllers/savingsController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getSavings).post(createSavings);
router.route("/:id").put(updateSavings).delete(deleteSavings);
router.route("/:id/installment").post(addInstallment);

export default router;
