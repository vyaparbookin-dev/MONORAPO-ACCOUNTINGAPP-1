import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function SecurityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/security/logs");
      setLogs(res.data?.logs || res.logs || []);
    } catch (error) {
      console.error("Failed to load logs", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Security & Audit Logs</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No security logs found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, index) => {
              const actionParts = (log.action || "Unknown Action").split('|');
              const mainAction = actionParts[0].trim();
              const changes = actionParts.length > 1 ? actionParts.slice(1).join('|').trim() : null;

              return (
                <div key={index} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{mainAction}</p>
                      {changes && (
                        <div className="mt-2 inline-block bg-red-50 border border-red-100 px-3 py-1.5 rounded-md">
                          <p className="text-sm font-medium text-red-600 font-mono">
                            {changes}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded">
                      {new Date(log.timestamp || log.date).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}