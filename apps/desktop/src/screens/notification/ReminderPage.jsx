import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { syncQueue } from "@repo/shared";

const ReminderPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      
      let localReminders = await dbService.getReminders?.() || [];
      
      if (!localReminders || localReminders.length === 0) {
        const response = await api.get("/api/reminders").catch(() => ({ data: [] }));
        localReminders = response.data || [];
      }
      
      setReminders(localReminders);
    } catch (error) {
      console.error("Failed to fetch reminders", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsDone = async (id) => {
    try {
      // Offline support
      if (dbService.updateReminder) await dbService.updateReminder(id, { status: 'done' });
      await syncQueue.enqueue({ entityId: id, entity: 'reminder', method: 'PUT', url: `/api/reminders/${id}/done` });
      
      setReminders(reminders.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Failed to mark reminder as done", error);
    }
  };

  return (
    <div className="reminder-page">
      {loading ? (
        <Loader />
      ) : reminders.length === 0 ? (
        <p>No reminders available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder) => (
              <tr key={reminder._id}>
                <td>{reminder.title}</td>
                <td>{reminder.description}</td>
                <td>{new Date(reminder.date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => markAsDone(reminder._id)}>Done</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReminderPage;