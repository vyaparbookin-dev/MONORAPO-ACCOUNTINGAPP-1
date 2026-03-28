import jwt from "jsonwebtoken";
import User from "../model/user.js";
import Company from "../model/company.js";

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ success: false, message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized, user not found" });
    }

    // --- SaaS Multi-Tenancy Logic ---
    const companyId = req.headers['x-company-id'];

    // If a company ID is provided in the header, validate it
    if (companyId) {
      // Validate the companyId
      const company = await Company.findById(companyId);

      // Check 1: Company exists
      if (!company) {
        return res.status(404).json({ success: false, message: "Company not found." });
      }

      // Check 2: User is authorized for this company
      if (company.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: "User not authorized for this company." });
      }

      // Attach companyId to the request for other controllers to use
      req.companyId = companyId;
    }
    // --- End SaaS Logic ---

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token invalid" });
  }
};

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