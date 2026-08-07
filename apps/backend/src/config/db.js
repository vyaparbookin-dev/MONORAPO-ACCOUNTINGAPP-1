

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vyapar_local"; // prefer env, fallback to local

    await mongoose.connect(uri);
    console.log(`✅ Connected to DB`);
  } catch (err) {
    // Log the error but do NOT exit the process — allow the server to run in
    // degraded mode for frontend development (helps when Mongo is not running).
    console.error("❌ DB Connection Failed:", err.message);
    console.warn('⚠️ Continuing without DB connection. Some API routes may fail.');
  }
};

export default connectDB;
