import User from "../model/user.js";
import bcryptjs from "bcryptjs"; // Consistent naming
import { generateToken } from "../config/jwt.js";
import sendEmail from "../utils/emailSender.js";
import { OAuth2Client } from 'google-auth-library';
import Company from "../model/company.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    console.log("[Auth Debug] register attempt for:", normalizedEmail);

    let user = await User.findOne({ email: normalizedEmail });

    // If user exists but is not verified, we'll resend OTP
    if (user && !user.isVerified) {
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 30 * 60 * 1000; // 30 minutes validity
      await user.save();
      try {
        // Fix: Use actual live frontend URL instead of localhost so mobile link works!
        const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
        const verifyLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;
        await sendEmail({ email: user.email, subject: 'Verify Your Account', message: `Your new OTP is: ${otp}.\n\nOr click here to verify your account: ${verifyLink}\n\nValid for 30 mins.` });
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
    const otp = generateOtp();
    const otpExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: role || 'admin',
      otp,
      otpExpires,
      isVerified: false, 
    });

    await user.save();

    try {
      // Fix: Use actual live frontend URL instead of localhost so mobile link works!
      const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
      const verifyLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;
      await sendEmail({ 
        email: user.email, 
        subject: 'Welcome! Verify Your Account', 
        message: `Your One-Time Password (OTP) is: ${otp}.\n\nOr click this link to auto-verify your account: ${verifyLink}\n\nIt is valid for 30 minutes.` 
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
    const normalizedEmail = String(email || "").trim().toLowerCase();
    console.log("[Auth Debug] login attempt for:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail }).select('+password'); // Explicitly include password
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: "Account not verified. Please verify your OTP first.", requiresVerification: true, userId: user._id });
    }

    const match = await bcryptjs.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // If login is successful, generate a token that includes the companyId
    const token = generateToken(user._id, user.companyId);

    // Don't send password and OTP fields back to the client
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    console.log("[Auth Debug] Login successful for:", normalizedEmail, "Company ID:", user.companyId);
    res.json({ success: true, user: userResponse, token: token });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    console.log("[Auth Debug] forgot-password attempt for:", normalizedEmail);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({ success: true, message: "If a user with this email exists, a password reset link has been sent." });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
    const resetLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;

    await sendEmail({
      email: user.email,
      subject: 'Reset Your Password',
      message: `Your password reset OTP is: ${otp}.\n\nOr click here to reset your password: ${resetLink}\n\nValid for 30 minutes.`
    });

    return res.status(200).json({ success: true, message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("🔴 FORGOT PASSWORD FAILED:", error);
    return res.status(500).json({ success: false, message: "Unable to process password reset right now." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "User ID, OTP and new password are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("🔴 RESET PASSWORD FAILED:", error);
    return res.status(500).json({ success: false, message: "Unable to reset password." });
  }
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

export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    console.log("[Auth Debug] Verifying Google token with Client ID:", clientId ? `${clientId.substring(0, 10)}...` : "Not Found! Check GOOGLE_CLIENT_ID on Render.");

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const { name, email } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      console.log(`[Google Auth] New user: ${email}. Creating new company.`);
      const company = new Company({
        name: `${name}'s Company`,
        ownerName: name,
        industryType: 'General',
        ownerEmail: email,
      });
      await company.save();

      user = new User({
        name,
        email,
        password: `google-auth-${Date.now()}`,
        companyId: company._id,
        isVerified: true,
        role: 'admin',
      });
      await user.save();
    } else {
      console.log(`[Google Auth] Existing user: ${email}. Logging in.`);
      if (!user.companyId) {
        const company = new Company({ name: `${name}'s Company`, ownerName: name, ownerEmail: email });
        await company.save();
        user.companyId = company._id;
        await user.save();
      }
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    console.log("[Auth Debug] Google login successful for:", email, "Company ID:", user.companyId);
    const token = generateToken(user._id, user.companyId);
    res.json({ success: true, token, user: userResponse });
  } catch (error) {
    console.error("🔴 Google Auth Error:", error.message);
    res.status(500).json({ message: "Server error during Google authentication. Check your GOOGLE_CLIENT_ID." });
  }
};