import React, { useState, useEffect } from 'react';

const SecurityLogPage = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Mock data for security logs
    const mockLogs = [
      { id: 1, event: 'Successful login', ip: '192.168.1.1', timestamp: '2025-12-26T10:00:00Z' },
      { id: 2, event: 'Password change', ip: '192.168.1.1', timestamp: '2025-12-26T10:05:00Z' },
      { id: 3, event: 'Failed login attempt', ip: '10.0.0.5', timestamp: '2025-12-26T11:30:00Z' },
      { id: 4, event: 'API key generated', ip: '192.168.1.1', timestamp: '2025-12-26T12:00:00Z' },
    ];
    setLogs(mockLogs);
    // In a real application, you would fetch these logs from an API
    // fetch('/api/security-logs').then(res => res.json()).then(data => setLogs(data));
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
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-3">{log.event}</td>
                <td className="p-3">{log.ip}</td>
                <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityLogPage;
