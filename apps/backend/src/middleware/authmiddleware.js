import jwt from "jsonwebtoken";
import User from "../model/user.js";
import Company from "../model/company.js";
import { asyncHandler } from "./errormiddleware.js";
import mongoose from "mongoose";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ success: false, message: "Not authorized, no token" });

  // Guest Demo Token Bypass
  if (token && (token.includes("demo_guest") || token.includes("guest"))) {
    req.user = {
      _id: "demo_guest_user_101",
      name: "Guest Explorer (अतिथि)",
      email: "demo@vyaparbook.in",
      role: "admin",
      isGuest: true
    };
    req.companyId = req.headers['x-company-id'] || "demo_company_101";
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

    if (companyId) {
      if (companyId.startsWith("demo_") || companyId.startsWith("custom_co_")) {
        // Pure sandboxed demo or custom sandbox requested: NEVER override with real company!
        req.companyId = companyId;
      } else if (!mongoose.Types.ObjectId.isValid(companyId)) {
        req.companyId = companyId;
      } else {
        const company = await Company.findById(companyId).lean();
        
        if (!company) {
          // If company in header was deleted or not found, fall back to user's first company or auto-create
          let userRealCompany = await Company.findOne({ user: reqUserId }).lean();
          if (!userRealCompany && req.user.companyId) {
            userRealCompany = await Company.findById(req.user.companyId).lean();
          }
          if (userRealCompany) {
            req.companyId = userRealCompany._id.toString();
          } else {
            // Auto create company for user if none exists so they never 404
            const newCo = new Company({
              name: `${req.user.name || 'My'}'s Business`,
              ownerName: req.user.name || req.user.email,
              ownerEmail: req.user.email,
              user: req.user._id,
              industryType: "general",
              businessType: ["general"]
            });
            await newCo.save();
            req.companyId = newCo._id.toString();
          }
        } else {
          const companyOwnerId = company.user?.toString();
          if (companyOwnerId && companyOwnerId !== reqUserId) {
            const userRealCompany = await Company.findOne({ user: reqUserId }).lean();
            if (userRealCompany) {
              req.companyId = userRealCompany._id.toString();
            } else {
              req.companyId = companyId;
            }
          } else {
            req.companyId = companyId;
          }
        }
      }
    } else {
      // If no company header was sent, auto-attach user's real company
      const userRealCompany = await Company.findOne({ user: reqUserId }).lean();
      if (userRealCompany) {
        req.companyId = userRealCompany._id.toString();
      } else if (req.user.companyId) {
        req.companyId = req.user.companyId.toString();
      }
    }

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
  if (!req.companyId) {
    return res.status(400).json({ success: false, message: "Company ID is strictly required for this operation. Please select a company." });
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
