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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password").lean();

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    const reqUserId = req.user._id?.toString() || req.user.id?.toString();

    // --- SaaS Multi-Tenancy Logic ---
    let companyId = req.headers['x-company-id'];
    console.log("[Auth Debug] Protected request => user:", reqUserId, "companyHeader:", companyId);

    if (companyId) {
      if (companyId.startsWith("demo_") || companyId.startsWith("custom_co_") || !mongoose.Types.ObjectId.isValid(companyId)) {
        // Check if user has a real registered company, prefer their real company over demo header
        const userRealCompany = await Company.findOne({ user: reqUserId }).lean();
        if (userRealCompany) {
          req.companyId = userRealCompany._id.toString();
        } else {
          req.companyId = companyId;
        }
      } else {
        const company = await Company.findById(companyId).lean();
        
        if (!company) {
          // If company in header was deleted or not found, fall back to user's first company
          const userRealCompany = await Company.findOne({ user: reqUserId }).lean();
          if (userRealCompany) {
            req.companyId = userRealCompany._id.toString();
          } else {
            return res.status(404).json({ success: false, message: "Company not found." });
          }
        } else {
          const companyOwnerId = company.user?.toString();
          if (companyOwnerId && companyOwnerId !== reqUserId) {
            console.warn("[Auth Debug] Header company mismatch, auto-repairing to user's own company:", { reqUserId, companyOwnerId, companyId });
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
