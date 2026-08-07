// Example: Companyroutes.js
import express from "express";
import { addCompany, listCompanies, getCompany, updateCompany, deleteCompany } from "../controllers/companyController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/")
  .post(protect, addCompany)
  .get(protect, listCompanies);

router.route("/:id")
  .get(protect, getCompany)
  .put(protect, updateCompany) // Backend route for updating frontend business details
  .delete(protect, deleteCompany); // Added DELETE route

export default router;