import Notification from "../model/notification.js";

export const addNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};