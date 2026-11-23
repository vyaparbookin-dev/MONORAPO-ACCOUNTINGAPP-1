import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "monorapo_accounting_super_secret_jwt_key_2026_prod";

export const generateToken = (userId, companyId) => {
  // Pre-date `iat` by 60 seconds to completely prevent clock skew / "JWT issued at future" (PGRST303) across all cloud services
  const iat = Math.floor(Date.now() / 1000) - 60;
  return jwt.sign({ id: userId, companyId, iat }, JWT_SECRET, {
    expiresIn: "365d",
  });
};

export const verifyToken = (token) => {
  try {
    // clockTolerance: 300 seconds (5 minutes) tolerance for local vs server clock differences
    return jwt.verify(token, JWT_SECRET, { clockTolerance: 300 });
  } catch (error) {
    return null;
  }
};
