import User from "../model/user.js";
import bcryptjs from "bcryptjs"; // Consistent naming
import { generateToken } from "../config/jwt.js";
import sendEmail from "../utils/emailSender.js"; // Use the new email sender

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    let user = await User.findOne({ email });

    // If user exists but is not verified, we'll resend OTP
    if (user && !user.isVerified) {
      // FIX: Render Free Tier blocks emails. Automatically verify existing unverified users.
      user.isVerified = true;
      await user.save();
      return res.status(200).json({ success: true, message: "Account verified automatically. Please log in.", requiresVerification: false });
    }

    if (user && user.isVerified) {
      return res.status(400).json({ message: "User with this email already exists and is verified." });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'admin',
      otp,
      otpExpires,
      isVerified: true, // FIX: Bypass OTP because Render Free Tier blocks SMTP emails
    });

    await user.save();

    // Try to send email silently, but don't fail the registration if it gets blocked
    try {
      await sendEmail({ email: user.email, subject: 'Welcome!', message: `Welcome to Vyapar App!` });
    } catch (e) {
      console.log("Email blocked by Render, but registration successful.");
    }

    res.status(201).json({ success: true, message: "User registered successfully!", requiresVerification: false, token: generateToken(user._id) });

  } catch (err) { console.error("🔴 REGISTRATION FAILED (Non-Email Error):", err); res.status(500).json({ success: false, message: err.message }); }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password'); // Explicitly include password
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: "Account not verified. Please verify your OTP first.", requiresVerification: true, userId: user._id });
    }

    const match = await bcryptjs.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // Don't send password and OTP fields back to the client
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    res.json({ success: true, user: userResponse, token: generateToken(user._id) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- New Controller for OTP Verification ---
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP are required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Account verified successfully. You can now log in." });

  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};