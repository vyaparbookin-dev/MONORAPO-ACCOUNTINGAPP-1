import jwt from "jsonwebtoken";
import User from "../model/user.js";
import Company from "../model/company.js";
import { asyncHandler } from "./errormiddleware.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ success: false, message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password").lean();

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    const reqUserId = req.user._id?.toString() || req.user.id?.toString();

    // --- SaaS Multi-Tenancy Logic ---
    const companyId = req.headers['x-company-id'];
    console.log("[Auth Debug] Protected request => user:", reqUserId, "companyHeader:", companyId);

    // If a company ID is provided in the header, validate it
    if (companyId) {
      // Validate the companyId using lean for performance
      const company = await Company.findById(companyId).lean();
      console.log("[Auth Debug] Company lookup for header ID:", companyId, "=>", company ? { _id: company._id.toString(), name: company.name, user: company.user?.toString() } : "NOT_FOUND");

      // Check 1: Company exists
      if (!company) {
        return res.status(404).json({ success: false, message: "Company not found or you don't have access." });
      }

      // Check 2: User is authorized for this company
      const companyOwnerId = company.user?.toString();
      if (!reqUserId || companyOwnerId !== reqUserId) {
        console.log("[Auth Debug] Company ownership mismatch:", { reqUserId, companyOwnerId, companyId });
        return res.status(403).json({ success: false, message: "User not authorized for this company." });
      }

      // Attach companyId to the request for other controllers to use
      req.companyId = companyId;
    }
    // --- End SaaS Logic ---

    next();
  } catch (error) {
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

/**
 * @desc    Protect routes meant for internal services like AI Gateway
 * @access  Internal
 */
export const protectAIGateway = (req, res, next) => {
  const internalToken = req.headers['x-internal-api-token'];
  if (internalToken && internalToken === process.env.INTERNAL_API_TOKEN) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid internal token.' });
};