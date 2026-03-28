import User from "../model/user.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../config/jwt.js";
import { sendEmailOtp } from "../config/otpservice.js";

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'admin' });

    // OTP Generate aur Send karne ka logic
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP banega
    if (email) await sendEmailOtp(email, otp);
    // if (phone) await sendSmsOtp(phone, otp); // Jab Twilio SMS chalana ho isko uncomment kar lena

    res.status(201).json({ success: true, user, message: "Registered successfully! OTP has been sent.", token: generateToken(user._id) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    res.json({ success: true, user, token: generateToken(user._id) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};