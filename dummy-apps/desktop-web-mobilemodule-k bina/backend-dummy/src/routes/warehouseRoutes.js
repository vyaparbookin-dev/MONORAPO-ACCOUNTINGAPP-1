import express from "express";
import { addWarehouse, listWarehouses } from "../controllers/warehouseController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addWarehouse).get(protect, listWarehouses);

export default router;