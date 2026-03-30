import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import { errorHandler } from "./src/middleware/errormiddleware.js"; // Changed SRC to src
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";

// Route Imports
import authRoutes from "./src/routes/authRoutes.js";
import billingRoutes from "./src/routes/billingRoutes.js";
import licensingRoutes from "./src/routes/licensingRoutes.js"; // Changed SRC to src
import branchRoutes from "./src/routes/branchRoutes.js";
import companyRoutes from "./src/routes/companyRoutes.js";
import coupanRoutes from "./src/routes/coupanRoutes.js";
import expanceRoutes from "./src/routes/expanceRoutes.js";
import inventoryRoutes from "./src/routes/inventoryRoutes.js";
import laterpadRoutes from "./src/routes/laterpadRoutes.js"; // Changed SRC to src
import membershipRoutes from "./src/routes/membershipRoutes.js"; // Changed SRC to src
import notificationRoutes from "./src/routes/notificationRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import partyRoutes from "./src/routes/partyRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import salaryRoutes from "./src/routes/salaryRoutes.js";
import staffRoutes from "./src/routes/staffRoutes.js";
import schemeRoutes from "./src/routes/schemeRoutes.js";
import securityRoutes from "./src/routes/securityRoutes.js"; // Changed SRC to src
import warehouseRoutes from "./src/routes/warehouseRoutes.js"; // Changed SRC to src
import syncRoutes from "./src/routes/syncRoutes.js";
import consolidatedStatementRoutes from "./src/routes/consolidatedStatementRoutes.js";
import purchaseRoutes from "./src/routes/purchaseRoutes.js";
import purchaseOrderRoutes from "./src/routes/purchaseOrderRoutes.js";
import bankRecRoutes from "./src/routes/bankRecRoutes.js";
import tdsTcsRoutes from "./src/routes/tdsTcsRoutes.js";
import fixedAssetRoutes from "./src/routes/fixedAssetRoutes.js";
import eWayBillRoutes from "./src/routes/eWayBillRoutes.js";
import returnRoutes from "./src/routes/returnRoutes.js";
import daybookRoutes from "./src/routes/daybookRoutes.js";
import b2bRoutes from "./src/routes/b2bRoutes.js";
import gstRoutes from "./src/routes/gstRoutes.js";
import stockTransferRoutes from "./src/routes/stockTransferRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import unitRoutes from "./src/routes/unitRoutes.js";
import cloudRoutes from "./src/routes/cloudRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js";
import agingRoutes from "./src/routes/agingRoutes.js";
import approvalRoutes from "./src/routes/approvalRoutes.js";
import whatsappRoutes from "./src/routes/whatsappRoutes.js";
import reminderRoutes from "./src/routes/reminderRoutes.js";
import { startCronJobs } from "./src/utils/cronJobs.js";
import tallyRoutes from "./src/routes/tallyRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.resolve(__dirname, ".env.local");
const envExamplePath = path.resolve(__dirname, ".env.example");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log("👉 Loaded keys from .env.local");
} else {
  dotenv.config({ path: envExamplePath });
  console.log("👉 Loaded keys from .env.example");
}
console.log("👉 CHECK LOADED URI:", process.env.MONGO_URI);

// Initialize Sentry for Error Tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN, // Aap ise baad me .env me dalenge
  environment: process.env.NODE_ENV || "development",
});

// Log uncaught errors for debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  Sentry.captureException(err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  Sentry.captureException(reason);
});
const app = express();

// Trust proxy for Render deployment (Required for express-rate-limit to work behind a proxy)
app.set('trust proxy', 1);


// --- Secure CORS Configuration ---
const allowedOrigins = [
  'http://localhost:5173', // Web Dev (Vite)
  'http://localhost:3000', // Web Dev (Create React App)
  'http://localhost:8082', // Mobile Dev
  'http://localhost:5174', // Desktop Dev
  'https://monorapo-accountingapp-1-web.vercel.app' // Vercel URL ko permanently add kar dein
];

// Dynamically add the production frontend URL from environment variables
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin, whitelisted origins, and ANY Vercel auto-generated URL.
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Global Middleware to extract Company ID from header
app.use((req, res, next) => {
  if (req.headers['x-company-id']) {
    req.companyId = req.headers['x-company-id'];
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply API Rate Limiting (DDoS Protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" },
  validate: { xForwardedForHeader: false } // FIX: Stops the 'trust proxy' error on Render
});

// Apply rate limiter specifically to all API routes
app.use("/api", apiLimiter);

app.get("/", (req, res) => res.send("Vyapar Backend Running ✅"));

// Render dynamically assigns a PORT, use 5001 as fallback for local dev
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();
    
    // Start Background Automation Jobs
    startCronJobs();

    // Mount Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/billing", billingRoutes);
    app.use("/api/licensing", licensingRoutes);
    app.use("/api/branch", branchRoutes);
    app.use("/api/company", companyRoutes);
    app.use("/api/coupon", coupanRoutes); // Fixed spelling to match frontend request
    app.use("/api/expance", expanceRoutes); // Old spelling
    app.use("/api/expenses", expanceRoutes); // Alias for correct spelling
    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/laterpad", laterpadRoutes);
    app.use("/api/membership", membershipRoutes);
    app.use("/api/notification", notificationRoutes);
    app.use("/api/payment", paymentRoutes);
    app.use("/api/party", partyRoutes);
    app.use("/api/report", reportRoutes);
    app.use("/api/salary", salaryRoutes);
    app.use("/api/staff", staffRoutes);
    app.use("/api/scheme", schemeRoutes);
    app.use("/api/security", securityRoutes);
    app.use("/api/warehouse", warehouseRoutes);
    app.use("/api/sync", syncRoutes);
    app.use("/api/consolidated-statement", consolidatedStatementRoutes);
    app.use("/api/purchase", purchaseRoutes);
    app.use("/api/purchase-orders", purchaseOrderRoutes);
    app.use("/api/bank-rec", bankRecRoutes);
    app.use("/api/tds-tcs", tdsTcsRoutes);
    app.use("/api/fixed-assets", fixedAssetRoutes);
    app.use("/api/ewaybill", eWayBillRoutes);
    app.use("/api/return", returnRoutes);
    app.use("/api/daybook", daybookRoutes);
    app.use("/api/b2b", b2bRoutes);
    app.use("/api/gst", gstRoutes);
    app.use("/api/stock-transfer", stockTransferRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/aging", agingRoutes);
    app.use("/api/approvals", approvalRoutes);
    app.use("/api/reminders", reminderRoutes);
    app.use("/api/category", categoryRoutes);
    app.use("/api/unit", unitRoutes);

    // Frontend Plural Mismatch Fixes (Aliases)
    app.use("/api/reports", reportRoutes);
    app.use("/api/schemes", schemeRoutes);
    app.use("/api/logs", securityRoutes);

    // Stub Routes for Upcoming Features (Prevents 404 Crashes)
    const stubRouter = express.Router();
    stubRouter.all('*', (req, res) => res.json({ success: true, message: "Feature coming soon / API under construction" }));
    
    app.use("/api/cloud", cloudRoutes); // Replaced stub with actual cloud routes
    app.use("/api/settings", settingsRoutes);
    app.use("/api/roles", stubRouter);
    app.use("/api/leaves", stubRouter);
    app.use("/api/keys", stubRouter);
    app.use("/api/whatsapp", whatsappRoutes);
    app.use("/api/tally", tallyRoutes);

    // Sentry Error Handler (Must be before custom error handler)
    Sentry.setupExpressErrorHandler(app);

    // Error Handler Middleware (must be last)
    app.use(errorHandler);

    // 404 Handler for debugging
    app.use((req, res) => {
      console.log(`⚠️ 404 Route Not Found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
    });

    // Start Listening strictly on PORT 5001
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Backend accessible at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
