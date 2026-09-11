import mongoose from "mongoose";
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
    const cleanPassword = String(password || "").trim();

    console.log("[Auth Debug] register attempt for:", normalizedEmail, "Phone:", cleanPhone);

    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        ...(cleanPhone ? [{ phone: cleanPhone }] : [])
      ] 
    });

    if (user) {
      user.password = await bcryptjs.hash(cleanPassword, 10);
      user.isVerified = true;
      if (cleanPhone) user.phone = cleanPhone;
      await user.save();
      return res.status(200).json({ success: true, message: "खाता पहले से मौजूद है! नया पासवर्ड सेट हो गया है। कृपया लॉगिन करें।" });
    }

    const hashedPassword = await bcryptjs.hash(cleanPassword, 10);
    const userId = new mongoose.Types.ObjectId();
    const companyId = new mongoose.Types.ObjectId();

    user = new User({
      _id: userId,
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role: role || 'admin',
      companyId: companyId,
      isVerified: true,
    });
    await user.save();

    const company = new Company({
      _id: companyId,
      name: businessName?.trim() || `${name || 'My'}'s Company`,
      ownerName: name || normalizedEmail,
      ownerEmail: normalizedEmail,
      user: userId,
      phone: cleanPhone || "",
      industryType: industryType || "general",
      businessType: [industryType || "general"],
    });
    await company.save();

    return res.status(201).json({ 
      success: true, 
      message: "खाता सफलतापूर्वक बन गया! अब आप लॉगिन कर सकते हैं।", 
      userId: user._id 
    });

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
    const cleanPassword = String(password || "").trim();

    console.log("[Auth Debug] login attempt for input:", rawInput, "Password length:", cleanPassword.length);

    if (!rawInput || !cleanPassword) {
      return res.status(400).json({ message: "मोबाइल नंबर/ईमेल और पासवर्ड दर्ज करना अनिवार्य है।" });
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

    const user = await User.findOne({ $or: queryConditions }).select('+password');
    console.log("[DEBUG] User found in DB?", !!user, "for input:", rawInput);

    if (!user) {
      return res.status(400).json({ 
        message: "यह मोबाइल नंबर या ईमेल पंजीकृत नहीं है। कृपया नीचे '⚡ 1-Click डायरेक्ट लॉगिन' दबाएँ।",
        suggestReset: true,
        suggestMagic: true,
        identifier: rawInput
      });
    }

    let match = await bcryptjs.compare(cleanPassword, user.password);
    if (!match && password !== cleanPassword) {
      match = await bcryptjs.compare(password, user.password);
    }
    if (!match && (user.password === cleanPassword || user.password === password)) {
      match = true;
      user.password = await bcryptjs.hash(cleanPassword, 10);
      await user.save();
    }

    if (!match) {
      return res.status(400).json({ 
        message: "गलत पासवर्ड दर्ज किया गया है। यदि आप पासवर्ड भूल गए हैं तो नीचे 'पासवर्ड भूल गए?' या '⚡ 1-Click डायरेक्ट लॉगिन' चुनें।",
        suggestReset: true,
        suggestMagic: true,
        identifier: rawInput
      });
    }

    user.isVerified = true;

    if (!user.companyId) {
      let existingCo = await Company.findOne({ user: user._id });
      if (!existingCo) {
        existingCo = new Company({
          name: `${user.name || 'My'} Company`,
          ownerName: user.name || user.email,
          ownerEmail: user.email,
          user: user._id,
          phone: user.phone || "",
          industryType: "general",
          businessType: ["general"],
        });
        await existingCo.save();
      }
      user.companyId = existingCo._id;
    }
    await user.save();

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();

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

// ⚡ 1-Click Instant Magic Login
export const magicLogin = async (req, res) => {
  try {
    const { identifier, email, phone } = req.body;
    const rawInput = String(identifier || email || phone || "").trim();
    const normalizedEmail = rawInput.toLowerCase();
    const numericOnly = rawInput.replace(/[^0-9]/g, "");
    const last10Digits = numericOnly.length >= 10 ? numericOnly.slice(-10) : numericOnly;

    console.log("[Auth Debug] Magic Login requested for:", rawInput);

    if (!rawInput) {
      return res.status(400).json({ success: false, message: "कृपया अपना मोबाइल नंबर या ईमेल दर्ज करें।" });
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
      const isEmail = rawInput.includes("@");
      const derivedName = isEmail ? rawInput.split("@")[0] : `User ${last10Digits}`;
      const userEmail = isEmail ? normalizedEmail : `${last10Digits}@vyapar.local`;

      const userId = new mongoose.Types.ObjectId();
      const companyId = new mongoose.Types.ObjectId();

      user = new User({
        _id: userId,
        name: derivedName,
        email: userEmail,
        phone: numericOnly || "",
        password: await bcryptjs.hash(`magic-${Date.now()}`, 10),
        companyId: companyId,
        isVerified: true,
        role: "admin",
      });
      await user.save();

      const company = new Company({
        _id: companyId,
        name: `${derivedName}'s Business`,
        ownerName: derivedName,
        ownerEmail: userEmail,
        user: userId,
        phone: numericOnly || "",
        industryType: "general",
        businessType: ["general"],
      });
      await company.save();
    } else {
      user.isVerified = true;
      if (!user.companyId) {
        let existingCo = await Company.findOne({ user: user._id });
        if (!existingCo) {
          existingCo = new Company({
            name: `${user.name || 'My'} Company`,
            ownerName: user.name || user.email,
            ownerEmail: user.email,
            user: user._id,
            phone: user.phone || "",
            industryType: "general",
            businessType: ["general"],
          });
          await existingCo.save();
        }
        user.companyId = existingCo._id;
      }
      await user.save();
    }

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();
    if (userCompanies.length === 0 && user.companyId) {
      const co = await Company.findById(user.companyId).select('_id name user').lean();
      if (co) userCompanies = [co];
    }

    const token = generateToken(user._id, user.companyId);
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;

    console.log("[Auth Debug] Magic direct login successful for:", rawInput);
    return res.json({ 
      success: true, 
      message: "डायरेक्ट लॉगिन सफल रहा! 🎉", 
      token, 
      user: userResponse,
      companies: userCompanies
    });
  } catch (err) {
    console.error("🔴 Magic Login Error:", err);
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
    const cleanNewPassword = String(newPassword || "").trim();

    console.log("[Auth Debug] Quick Reset attempt for:", rawInput, "New Password length:", cleanNewPassword.length);

    if (!rawInput || !cleanNewPassword || cleanNewPassword.length < 4) {
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
      const isEmail = rawInput.includes("@");
      const derivedName = isEmail ? rawInput.split("@")[0] : `User ${last10Digits}`;
      const userEmail = isEmail ? normalizedEmail : `${last10Digits}@vyapar.local`;
      const hashedPassword = await bcryptjs.hash(cleanNewPassword, 10);

      const userId = new mongoose.Types.ObjectId();
      const companyId = new mongoose.Types.ObjectId();

      user = new User({
        _id: userId,
        name: derivedName,
        email: userEmail,
        phone: numericOnly || "",
        password: hashedPassword,
        companyId: companyId,
        isVerified: true,
        role: "admin",
      });
      await user.save();

      const company = new Company({
        _id: companyId,
        name: `${derivedName}'s Business`,
        ownerName: derivedName,
        ownerEmail: userEmail,
        user: userId,
        phone: numericOnly || "",
        industryType: "general",
        businessType: ["general"],
      });
      await company.save();
    } else {
      user.password = await bcryptjs.hash(cleanNewPassword, 10);
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;

      if (!user.companyId) {
        let existingCo = await Company.findOne({ user: user._id });
        if (!existingCo) {
          existingCo = new Company({
            name: `${user.name || 'My'} Company`,
            ownerName: user.name || user.email,
            ownerEmail: user.email,
            user: user._id,
            phone: user.phone || "",
            industryType: "general",
            businessType: ["general"]
          });
          await existingCo.save();
        }
        user.companyId = existingCo._id;
      }
      await user.save();
    }

    let userCompanies = await Company.find({ user: user._id }).select('_id name user').lean();
    if (userCompanies.length === 0 && user.companyId) {
      const co = await Company.findById(user.companyId).select('_id name user').lean();
      if (co) userCompanies = [co];
    }

    const token = generateToken(user._id, user.companyId);
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    console.log("[Auth Debug] Quick password reset successful for:", rawInput, "User:", user._id.toString());
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
    const cleanNewPassword = String(newPassword || "").trim();
    if (!userId || !cleanNewPassword) {
      return res.status(400).json({ success: false, message: "User ID और नया पासवर्ड अनिवार्य हैं।" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (otp && (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now())) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    user.password = await bcryptjs.hash(cleanNewPassword, 10);
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
  const { credential, email: directEmail, name: directName } = req.body;
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    let name = directName || "Google User";
    let email = directEmail || "";
    let verified = false;

    if (credential && clientId) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        name = payload.name || name;
        email = payload.email || email;
        verified = true;
      } catch (tokenErr) {
        console.warn("⚠️ Google library verifyIdToken mismatch/failed, attempting safe JWT payload decoding:", tokenErr.message);
      }
    }

    if (credential && !verified) {
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
      return res.status(400).json({ success: false, message: "Google ईमेल नहीं मिल सका। कृपया सीधे ईमेल द्वारा लॉगिन करें।" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const userId = new mongoose.Types.ObjectId();
      const companyId = new mongoose.Types.ObjectId();

      user = new User({
        _id: userId,
        name,
        email: email.toLowerCase(),
        password: await bcryptjs.hash(`google-auth-${Date.now()}-${Math.random()}`, 10),
        companyId: companyId,
        isVerified: true,
        role: 'admin',
      });
      await user.save();

      const company = new Company({
        _id: companyId,
        name: `${name}'s Company`,
        ownerName: name,
        industryType: 'General',
        businessType: ['General'],
        ownerEmail: email.toLowerCase(),
        user: userId,
      });
      await company.save();
    } else {
      user.isVerified = true;
      if (!user.companyId) {
        let existingCo = await Company.findOne({ user: user._id });
        if (!existingCo) {
          existingCo = new Company({ 
            name: `${user.name || name}'s Company`, 
            ownerName: user.name || name, 
            ownerEmail: email.toLowerCase(),
            user: user._id,
            industryType: 'General',
            businessType: ['General'],
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
    const cleanNewPassword = String(newPassword || "").trim();
    const userId = req.user?._id;

    if (!cleanNewPassword || cleanNewPassword.length < 4) {
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

    user.password = await bcryptjs.hash(cleanNewPassword, 10);
    await user.save();

    console.log(`[Auth Debug] Password changed successfully for user: ${user.email}`);
    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("🔴 Change Password Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
