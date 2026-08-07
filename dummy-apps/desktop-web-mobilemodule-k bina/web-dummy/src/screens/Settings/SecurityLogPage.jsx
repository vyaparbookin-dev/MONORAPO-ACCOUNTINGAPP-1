import React, { useState, useEffect } from 'react';
import { api } from '@repo/shared';

const SecurityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => { // This was missing the async call
      try {
        const response = await api.get('/security-logs'); // The API call was missing
        setLogs(response.logs || []); // Assuming the backend returns { logs: [...] }
      } catch (error) {
        console.error("Failed to fetch security logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Security Logs</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Event</th>
              <th className="p-3 text-left">IP Address</th>
              <th className="p-3 text-left">Timestamp</th>
            </tr>
          </thead>
          {loading ? (
            <tbody><tr><td colSpan="3" className="p-4 text-center">Loading...</td></tr></tbody>
          ) : (
            <tbody>
              {logs.map((log) => ( // Using log._id as key
                <tr key={log._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{log.action}</td> 
                  <td className="p-3">{log.ipAddress || 'N/A'}</td> 
                  <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default SecurityLogPage;
