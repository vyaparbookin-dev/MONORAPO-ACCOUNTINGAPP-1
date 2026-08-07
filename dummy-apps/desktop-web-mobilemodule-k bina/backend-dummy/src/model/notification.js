import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: String,
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
});

export default mongoose.model("Notification", notificationSchema);