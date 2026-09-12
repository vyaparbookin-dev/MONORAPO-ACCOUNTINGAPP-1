import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "monorapo_accounting_super_secret_jwt_key_2026_prod";

export const generateToken = (userId, companyId) => {
  return jwt.sign({ id: userId, companyId }, JWT_SECRET, {
    expiresIn: "365d",
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};