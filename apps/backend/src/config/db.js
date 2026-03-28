

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vyapar_local"; // prefer env, fallback to local

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`✅ Connected to DB`);
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
