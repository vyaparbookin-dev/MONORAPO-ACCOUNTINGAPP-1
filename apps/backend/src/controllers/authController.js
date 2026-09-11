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
      user.otpExpires = Date.now() + 30 * 60 * 1000;
      await user.save();
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
        const verifyLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;
        await sendEmail({ email: user.email, subject: 'Verify Your Account', message: `Your new OTP is: ${otp}.\n\nOr click here to verify your account: ${verifyLink}\n\nValid for 30 mins.` });
        return res.status(200).json({ success: true, message: "A new OTP has been sent to your email.", requiresVerification: true, userId: user._id, debugOtp: otp });
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
      isVerified: true, // Auto-verify on registration to prevent blocking users
    });

    await user.save();

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
    } catch (e) {
      console.warn("⚠️ Initial Email OTP notification skipped:", e.message);
    }

    return res.status(201).json({ success: true, message: "खाता सफलतापूर्वक बन गया! अब आप लॉगिन कर सकते हैं।", requiresVerification: false, userId: user._id });

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

    // Build regex for case-insensitive exact email match
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    const queryConditions = [
      { email: emailRegex },
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
      return res.status(400).json({ 
        message: "यह मोबाइल नंबर या ईमेल पंजीकृत (Register) नहीं है। कृपया सही क्रेडेंशियल दर्ज करें या नीचे नया पासवर्ड सेट करें।",
        suggestReset: true 
      });
    }

    const match = await bcryptjs.compare(password, user.password);
    console.log("[DEBUG] Password match result:", match);
    if (!match) {
      return res.status(400).json({ 
        message: "गलत पासवर्ड (Incorrect Password)! यदि आप पासवर्ड भूल गए हैं तो नीचे 'नया पासवर्ड बनाएं' पर क्लिक करें।",
        suggestReset: true,
        identifier: rawInput
      });
    }

    // Ensure verified
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();

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

// 1-Click Quick Password Reset & Auto-Login
export const quickResetPassword = async (req, res) => {
  try {
    const { identifier, email, phone, newPassword } = req.body;
    const rawInput = String(identifier || email || phone || "").trim();
    const normalizedEmail = rawInput.toLowerCase();
    const numericOnly = rawInput.replace(/[^0-9]/g, "");
    const last10Digits = numericOnly.length >= 10 ? numericOnly.slice(-10) : numericOnly;

    console.log("[Auth Debug] Quick Reset attempt for:", rawInput);

    if (!rawInput || !newPassword || newPassword.length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: "कृपया सही मोबाइल नंबर/ईमेल और कम से कम 4 अक्षरों का नया पासवर्ड दर्ज करें।" 
      });
    }

    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${escapedEmail}$`, 'i');

    const queryConditions = [
      { email: emailRegex },
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

    let user = await User.findOne({ $or: queryConditions });

    if (!user) {
      // Create user automatically with this password so user is never blocked
      const isEmail = rawInput.includes("@");
      const derivedName = isEmail ? rawInput.split("@")[0] : `User ${last10Digits}`;
      const userEmail = isEmail ? normalizedEmail : `${last10Digits}@vyapar.local`;
      const hashedPassword = await bcryptjs.hash(newPassword, 10);

      const company = new Company({
        name: `${derivedName}'s Business`,
        ownerName: derivedName,
        ownerEmail: userEmail,
        phone: numericOnly || "",
        industryType: "general",
        businessType: "general",
      });
      await company.save();

      user = new User({
        name: derivedName,
        email: userEmail,
        phone: numericOnly || "",
        password: hashedPassword,
        companyId: company._id,
        isVerified: true,
        role: "admin",
      });
      await user.save();
      company.user = user._id;
      await company.save();
    } else {
      user.password = await bcryptjs.hash(newPassword, 10);
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
    }

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();
    if (!user.companyId && userCompanies.length > 0) {
      user.companyId = userCompanies[0]._id;
      await user.save();
    }

    const token = generateToken(user._id, user.companyId);
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    console.log("[Auth Debug] Quick password reset successful for:", rawInput);
    return res.json({ 
      success: true, 
      message: "पासवर्ड सफलतापूर्वक अपडेट हो गया और आप लॉगिन हो गए हैं! 🎉", 
      token, 
      user: userResponse,
      companies: userCompanies
    });
  } catch (err) {
    console.error("🔴 Quick Reset Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email, identifier, phone } = req.body;
    const rawInput = String(identifier || email || phone || "").trim();
    const normalizedEmail = rawInput.toLowerCase();
    const numericOnly = rawInput.replace(/[^0-9]/g, "");
    const last10Digits = numericOnly.length >= 10 ? numericOnly.slice(-10) : numericOnly;

    console.log("[Auth Debug] forgot-password attempt for:", rawInput);

    if (!rawInput) {
      return res.status(400).json({ success: false, message: "ईमेल या मोबाइल नंबर दर्ज करना आवश्यक है।" });
    }

    const queryConditions = [
      { email: normalizedEmail },
      { email: rawInput }
    ];

    if (numericOnly.length >= 7) {
      queryConditions.push(
        { phone: rawInput },
        { phone: numericOnly },
        { phone: last10Digits }
      );
    }

    const user = await User.findOne({ $or: queryConditions });
    const otp = generateOtp();

    if (user) {
      user.otp = otp;
      user.otpExpires = Date.now() + 30 * 60 * 1000;
      await user.save();

      try {
        const frontendUrl = process.env.FRONTEND_URL || 'https://monorapo-accountingapp-1.onrender.com';
        const resetLink = `${frontendUrl}/verify-otp?userId=${user._id}&otp=${otp}`;
        await sendEmail({
          email: user.email,
          subject: 'Reset Your Password',
          message: `Your password reset OTP is: ${otp}.\n\nOr click here to reset your password: ${resetLink}\n\nValid for 30 minutes.`
        });
      } catch (err) {
        console.warn("⚠️ SMTP failed, fallback returning OTP in response:", err.message);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "पासवर्ड रीसेट लिंक / OTP तैयार कर दिया गया है। आप नीचे सीधे नया पासवर्ड भी सेट कर सकते हैं।",
      userId: user?._id,
      debugOtp: otp
    });
  } catch (error) {
    console.error("🔴 FORGOT PASSWORD FAILED:", error);
    return res.status(500).json({ success: false, message: "Unable to process password reset right now." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: "User ID और नया पासवर्ड अनिवार्य हैं।" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (otp && (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now())) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. Please log in." });
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
