

import mongoose from "mongoose";
import { startCronJobs } from "../utils/cronJobs.js";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vyapar_local"; // prefer env, fallback to local

    // --- CRITICAL FIX: Ensure a database name is present in the Atlas URI ---
    // If the URI is for Atlas and doesn't have a DB name before the '?', Mongoose defaults to the 'test' DB.
    // This check prevents the app from connecting to the wrong, empty database.
    if (uri.includes('mongodb+srv://') && !/\/([a-zA-Z0-9_-]+)\?/.test(uri)) {
      console.error("❌ FATAL: MONGO_URI is missing a database name!");
      console.error("❌ Your URI looks like: ...mongodb.net/?appName=...");
      console.error("❌ It MUST look like: ...mongodb.net/YOUR_DB_NAME?appName=...");
      console.error("❌ Please set the correct database name (e.g., 'simple_mflix') in your MONGO_URI on Render.com.");
      // In production, we must exit if the DB connection is wrong.
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      throw new Error("MONGO_URI is missing a database name.");
    }

    await mongoose.connect(uri);
    console.log(`✅ Connected to DB`);
    console.log("[DEBUG] Connected to MongoDB database name:", mongoose.connection.db.databaseName);
    startCronJobs(); // Start cron jobs only after successful DB connection
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
  }
};

export default connectDB;
