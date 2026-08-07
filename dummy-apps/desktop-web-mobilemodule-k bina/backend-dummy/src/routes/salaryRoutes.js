import express from "express";
import { addSalary, listSalaries, getSalaryById, updateSalary, deleteSalary } from "../controllers/salaryController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addSalary).get(protect, listSalaries);
router.route("/:id").get(protect, getSalaryById).put(protect, updateSalary).delete(protect, deleteSalary);

export default router;