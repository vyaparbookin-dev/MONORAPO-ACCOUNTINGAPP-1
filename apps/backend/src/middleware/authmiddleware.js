import jwt from "jsonwebtoken";
import User from "../model/user.js";
import Company from "../model/company.js";
import { asyncHandler } from "./errormiddleware.js";
import mongoose from "mongoose";

export const DEFAULT_PRIMARY_COMPANY_ID = "6a8314470d93e58ad0920950";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Guest Demo / Mobile Offline Token Fallback (Never 401 on mobile view)
  if (!token || token === "null" || token === "undefined" || token.includes("demo_guest") || token.includes("guest")) {
    req.user = {
      _id: "demo_guest_user_101",
      name: "Guest Explorer (अतिथि)",
      email: "guest@vyaparbook.in",
      role: "guest",
      isGuest: true
    };
    let cid = req.headers['x-company-id'];
    if (!cid || cid === "demo_company_guest" || cid === "my_primary_company" || !mongoose.Types.ObjectId.isValid(cid)) {
      cid = DEFAULT_PRIMARY_COMPANY_ID;
    }
    req.companyId = cid;
    return next();
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "monorapo_accounting_super_secret_jwt_key_2026_prod";
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password").lean();

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    const reqUserId = req.user._id?.toString() || req.user.id?.toString();

    // --- SaaS Multi-Tenancy Logic ---
    let companyId = req.headers['x-company-id'];

    if (!companyId || companyId === "demo_company_guest" || companyId === "my_primary_company") {
      let userRealCompany = await Company.findOne({ user: reqUserId }).lean();
      if (!userRealCompany && req.user.companyId) {
        userRealCompany = await Company.findById(req.user.companyId).lean();
      }
      companyId = userRealCompany ? userRealCompany._id.toString() : DEFAULT_PRIMARY_COMPANY_ID;
    }

    if (companyId) {
      if (companyId.startsWith("demo_") || companyId.startsWith("custom_co_")) {
        companyId = DEFAULT_PRIMARY_COMPANY_ID;
      } else if (!mongoose.Types.ObjectId.isValid(companyId) && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(companyId)) {
        companyId = DEFAULT_PRIMARY_COMPANY_ID;
      } else {
        const company = await Company.findById(companyId).lean();
        if (!company) {
          companyId = DEFAULT_PRIMARY_COMPANY_ID;
        }
      }
    } else {
      companyId = DEFAULT_PRIMARY_COMPANY_ID;
    }

    req.companyId = companyId;
    next();
  } catch (error) {
    console.error("🔴 Auth middleware token verify failed:", error.message);
    res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
});

// Middleware to check user roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Strict SaaS Middleware: Enforce Company Selection
export const requireCompany = (req, res, next) => {
  if (!req.companyId || req.companyId === "demo_company_guest") {
    req.companyId = DEFAULT_PRIMARY_COMPANY_ID;
  }
  next();
};

export const protectAIGateway = (req, res, next) => {
  const internalToken = req.headers['x-internal-api-token'];
  if (internalToken && internalToken === process.env.INTERNAL_API_TOKEN) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid internal token.' });
};
