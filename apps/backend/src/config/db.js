

import mongoose from "mongoose";
import { startCronJobs } from "../utils/cronJobs.js";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vyapar_local"; // prefer env, fallback to local

    // --- CRITICAL DATABASE NAME CHECK ---
    // If the URI is for Atlas and doesn't have a DB name before the '?', it will default to 'test' DB.
    if (uri.includes('mongodb+srv://') && !/\/([a-zA-Z0-9_-]+)\?/.test(uri)) {
      console.error("❌ FATAL: MONGO_URI is missing a database name! Example: .net/my-database?appName=...");
      throw new Error("MONGO_URI must include a database name.");
    }
    await mongoose.connect(uri);
    console.log(`✅ Connected to DB`);
    console.log("[DEBUG] Connected to MongoDB database name:", mongoose.connection.db.databaseName);
    startCronJobs(); // Start cron jobs only after successful DB connection
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    // Exit the process if DB connection fails in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
