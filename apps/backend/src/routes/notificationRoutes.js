import express from "express";
import { addNotification, listNotifications } from "../controllers/notificationController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.route("/").post(protect, addNotification).get(protect, listNotifications);

export default router