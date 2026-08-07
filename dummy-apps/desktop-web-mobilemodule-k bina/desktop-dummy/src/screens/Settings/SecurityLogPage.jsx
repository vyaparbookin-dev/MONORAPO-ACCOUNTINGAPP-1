import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import Loader from '../../components/Loader';

const SecurityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await dbService.getAuditLogs();
        setLogs(data || []);
      } catch (error) {
        console.error("Failed to fetch security logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Security Logs</h2>
      {loading && <Loader />}
      {!loading && logs.length === 0 && <p className="text-center text-gray-500">No security logs found.</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Details</th>
              <th className="p-3 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-3 font-medium">{log.userName}</td>
                <td className="p-3"><span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">{log.action}</span></td>
                <td className="p-3 text-sm text-gray-600">{log.details}</td>
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
