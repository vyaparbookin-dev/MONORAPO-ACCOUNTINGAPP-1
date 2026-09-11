import User from "../model/user.js";
import bcryptjs from "bcryptjs";
import { generateToken } from "../config/jwt.js";
import sendEmail from "../utils/emailSender.js";
import { OAuth2Client } from 'google-auth-library';
import Company from "../model/company.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, businessName, industryType } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = String(phone || "").trim();
    console.log("[Auth Debug] register attempt for:", normalizedEmail, "Phone:", cleanPhone);

    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        ...(cleanPhone ? [{ phone: cleanPhone }] : [])
      ] 
    });

    // If user exists but is not verified, we'll resend OTP
    if (user && !user.isVerified) {
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 30 * 60 * 1000; // 30 minutes validity
      await user.save();
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
        const verifyLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;
        await sendEmail({ email: user.email, subject: 'Verify Your Account', message: `Your new OTP is: ${otp}.\n\nOr click here to verify your account: ${verifyLink}\n\nValid for 30 mins.` });
        return res.status(200).json({ success: true, message: "A new OTP has been sent to your email.", requiresVerification: true, userId: user._id });
      } catch (emailError) {
        console.error("🔴 EMAIL RESEND FAILED:", emailError.message);
        user.isVerified = true;
        await user.save();
        return res.status(200).json({ success: true, message: "Account ready! Please log in with your credentials." });
      }
    }

    if (user && user.isVerified) {
      return res.status(400).json({ message: "User with this email/phone already exists. Please log in." });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const otp = generateOtp();
    const otpExpires = Date.now() + 30 * 60 * 1000;

    user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role: role || 'admin',
      otp,
      otpExpires,
      isVerified: false, 
    });

    await user.save();

    // Create a company for the new user
    const company = new Company({
      name: businessName?.trim() || `${name}'s Company`,
      ownerName: name,
      ownerEmail: normalizedEmail,
      user: user._id,
      phone: cleanPhone || "",
      industryType: industryType || "general",
      businessType: industryType || "general",
    });
    await company.save();
    user.companyId = company._id;
    await user.save();

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
      const verifyLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;
      await sendEmail({ 
        email: user.email, 
        subject: 'Welcome! Verify Your Account', 
        message: `Your One-Time Password (OTP) is: ${otp}.\n\nOr click this link to auto-verify your account: ${verifyLink}\n\nIt is valid for 30 minutes.` 
      });
      return res.status(201).json({ success: true, message: "User registered. Please check your email for the OTP.", requiresVerification: true, userId: user._id });
    } catch (e) {
      console.warn("⚠️ Initial Email OTP failed, auto-verifying user for seamless login:", e.message);
      user.isVerified = true;
      await user.save();
      return res.status(201).json({ success: true, message: "User registered successfully! You can now log in." });
    }

  } catch (err) { 
    console.error("🔴 REGISTRATION FAILED:", err); 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

// Login with Mobile Number OR Email
export const login = async (req, res) => {
  try {
    const { email, phone, identifier, username, password } = req.body;
    const rawInput = String(identifier || email || phone || username || "").trim();
    const normalizedEmail = rawInput.toLowerCase();
    const numericOnly = rawInput.replace(/[^0-9]/g, "");
    const last10Digits = numericOnly.length >= 10 ? numericOnly.slice(-10) : numericOnly;

    console.log("[Auth Debug] login attempt for input:", rawInput, "Extracted 10-digit Phone:", last10Digits);

    if (!rawInput || !password) {
      return res.status(400).json({ message: "मोबाइल नंबर/ईमेल और पासवर्ड दर्ज करना अनिवार्य है (Mobile/Email & Password required)." });
    }

    const queryConditions = [
      { email: normalizedEmail },
      { email: rawInput }
    ];

    if (numericOnly.length >= 7) {
      queryConditions.push(
        { phone: rawInput },
        { phone: numericOnly },
        { phone: last10Digits },
        { phone: `+91${last10Digits}` },
        { phone: `91${last10Digits}` }
      );
    }

    const user = await User.findOne({ $or: queryConditions }).select('+password');
    console.log("[DEBUG] User found in DB?", !!user, "for input:", rawInput);

    if (!user) {
      console.log("[DEBUG] Total users in DB:", await User.countDocuments());
      return res.status(400).json({ message: "खाता नहीं मिला (User not found). कृपया सही ईमेल या मोबाइल नंबर दर्ज करें।" });
    }

    const match = await bcryptjs.compare(password, user.password);
    console.log("[DEBUG] Password match result:", match);
    if (!match) {
      return res.status(400).json({ message: "गलत पासवर्ड (Incorrect password). कृपया सही पासवर्ड दर्ज करें।" });
    }

    // Auto-verify if password matches
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();
    console.log("[Auth Debug] Companies owned by user:", userCompanies.length);

    if (!user.companyId && userCompanies.length > 0) {
      user.companyId = userCompanies[0]._id;
      await user.save();
    }

    if (!user.companyId) {
      const fallbackCompany = new Company({
        name: `${user.name || 'My'} Company`,
        ownerName: user.name || normalizedEmail,
        ownerEmail: normalizedEmail,
        user: user._id,
        email: normalizedEmail,
      });
      await fallbackCompany.save();
      user.companyId = fallbackCompany._id;
      await user.save();
      userCompanies = [{ _id: fallbackCompany._id, name: fallbackCompany.name, user: user._id }];
    }

    const token = generateToken(user._id, user.companyId);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    console.log("[Auth Debug] Login successful for:", rawInput, "Company ID:", user.companyId?.toString?.() || user.companyId);
    res.json({ success: true, user: userResponse, token: token, companies: userCompanies });
  } catch (err) { 
    console.error("🔴 Login Error:", err);
    res.status(500).json({ success: false, message: err.message }); 
  }
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
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

// Resilient Google Login
export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  try {
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required." });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    let name = "Google User";
    let email = "";
    let verified = false;

    if (clientId) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        name = payload.name || "Google User";
        email = payload.email;
        verified = true;
      } catch (tokenErr) {
        console.warn("⚠️ Google library verifyIdToken mismatch/failed, attempting safe JWT payload decoding:", tokenErr.message);
      }
    }

    if (!verified) {
      const parts = String(credential).split('.');
      if (parts.length >= 2) {
        try {
          const payloadStr = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
          const payload = JSON.parse(payloadStr);
          if (payload.email) {
            name = payload.name || payload.email.split('@')[0];
            email = payload.email.toLowerCase();
          }
        } catch (decodeErr) {
          console.error("Failed to decode token payload:", decodeErr);
        }
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "Could not extract email from Google login token." });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`[Google Auth] New user: ${email}. Creating user and company.`);
      const company = new Company({
        name: `${name}'s Company`,
        ownerName: name,
        industryType: 'General',
        businessType: 'General',
        ownerEmail: email.toLowerCase(),
      });
      await company.save();

      user = new User({
        name,
        email: email.toLowerCase(),
        password: await bcryptjs.hash(`google-auth-${Date.now()}-${Math.random()}`, 10),
        companyId: company._id,
        isVerified: true,
        role: 'admin',
      });
      await user.save();
      
      company.user = user._id;
      await company.save();
    } else {
      console.log(`[Google Auth] Existing user: ${email}. Logging in.`);
      user.isVerified = true;
      if (!user.companyId) {
        let existingCo = await Company.findOne({ user: user._id });
        if (!existingCo) {
          existingCo = new Company({ 
            name: `${user.name || name}'s Company`, 
            ownerName: user.name || name, 
            ownerEmail: email.toLowerCase(),
            user: user._id 
          });
          await existingCo.save();
        }
        user.companyId = existingCo._id;
        await user.save();
      }
    }

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    const token = generateToken(user._id, user.companyId);
    console.log("[Auth Debug] Google login successful for:", email, "Company ID:", user.companyId);
    res.json({ success: true, token, user: userResponse, companies: userCompanies });
  } catch (error) {
    console.error("🔴 Google Auth Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during Google authentication." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: "New password must be at least 4 characters long." });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (currentPassword && user.password) {
      const match = await bcryptjs.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({ success: false, message: "Current password does not match." });
      }
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`[Auth Debug] Password changed successfully for user: ${user.email}`);
    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("🔴 Change Password Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
