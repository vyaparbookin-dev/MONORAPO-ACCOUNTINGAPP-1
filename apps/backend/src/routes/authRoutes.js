import express from "express";
import { register, login, verifyOtp, forgotPassword, resetPassword, googleAuth, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);
router.post("/google", googleAuth);

export default router;