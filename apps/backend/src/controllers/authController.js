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
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes validity
      await user.save();
      try {
        await sendEmail({ email: user.email, subject: 'Verify Your Account', message: `Your new OTP is: ${otp}. Valid for 10 mins.` });
        return res.status(200).json({ success: true, message: "A new OTP has been sent to your email.", requiresVerification: true, userId: user._id });
      } catch (emailError) {
        console.error("🔴 EMAIL RESEND FAILED:", emailError.message);
        return res.status(500).json({ success: false, message: "Failed to resend verification email. Please try again." });
      }
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
      isVerified: false, 
    });

    await user.save();

    try {
      await sendEmail({ 
        email: user.email, 
        subject: 'Welcome! Verify Your Account', 
        message: `Your One-Time Password (OTP) is: ${otp}. It is valid for 10 minutes.` 
      });
      // Don't send a token on registration. Force user to verify OTP.
      return res.status(201).json({ success: true, message: "User registered. Please check your email for the OTP.", requiresVerification: true, userId: user._id });
    } catch (e) {
      console.error("🔴 INITIAL EMAIL FAILED:", e.message);
      return res.status(500).json({ success: false, message: "User registered, but failed to send OTP email. Please try again." });
    }

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