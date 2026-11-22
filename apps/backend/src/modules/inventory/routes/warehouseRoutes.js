import express from "express";
import { 
  addWarehouse, 
  listWarehouses, 
  updateWarehouse, 
  deleteWarehouse 
} from "../controllers/warehouseController.js";
import { protect } from "../../../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").post(addWarehouse).get(listWarehouses);
router.route("/:id").put(updateWarehouse).delete(deleteWarehouse);

export default router;
