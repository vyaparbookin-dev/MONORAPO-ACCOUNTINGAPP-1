import React, { useEffect, useState } from "react";
import axios from "axios";
import Loader from "../../components/Loader";

const ReminderPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/reminders"); // Backend endpoint
      setReminders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch reminders", error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsDone = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/done`);
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