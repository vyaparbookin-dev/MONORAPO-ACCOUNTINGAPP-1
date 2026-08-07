import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { syncQueue } from "@repo/shared";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      let localNotifs = await dbService.getNotifications?.() || [];
      
      if (!localNotifs || localNotifs.length === 0) {
        const response = await api.get("/api/notification").catch(() => ({ data: [] }));
        localNotifs = response.data || [];
      }
      
      setNotifications(localNotifs);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      // Offline support
      if (dbService.updateNotification) await dbService.updateNotification(id, { isRead: true });
      await syncQueue.enqueue({ entityId: id, entity: 'notification', method: 'PUT', url: `/api/notification/${id}`, data: { isRead: true } });
      
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading notifications...</div>;

  return (
    <div className="p-4 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>
      <div className="space-y-2">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-lg border ${
                notif.isRead
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{notif.title}</h3>
                  <p className="text-gray-600">{notif.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">No notifications</div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
