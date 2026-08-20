import express from "express";
import { getUnits, createUnit, deleteUnit } from "../controllers/unitController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.route("/")
  .get(protect, getUnits)
  .post(protect, createUnit);

router.route("/:id")
  .delete(protect, deleteUnit);

export default router;
