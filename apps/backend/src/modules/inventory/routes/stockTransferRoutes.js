import express from "express";
import { 
  initiateTransfer, 
  getTransfers, 
  getTransferById, 
  updateTransferStatus, 
  deleteTransfer 
} from "../controllers/stockTransferController.js";
import { protect } from "../../../middleware/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", initiateTransfer);
router.get("/", getTransfers);
router.get("/:id", getTransferById);
router.patch("/:id/status", updateTransferStatus);
router.delete("/:id", deleteTransfer);

export default router;
