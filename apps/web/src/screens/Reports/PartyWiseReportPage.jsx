import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { Printer } from "lucide-react";

const PartyWiseReportPage = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/reports/partywise");
      const d = response.data || response;
      setReport(Array.isArray(d) ? d : []);
    } catch (error) {
      console.error("Error fetching partywise report:", error);
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold print:text-2xl">Party Wise Report</h1>
          <p className="text-sm text-gray-600">Summary of balances for all parties</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => window.print()} className="bg-gray-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-gray-800">
            <Printer size={16} /> Print
          </button>
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Refresh
          </button>
        </div>
      </div>

      {loading && <Loader />}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Party Name</th>
              <th className="px-4 py-3 text-right">Total Purchase</th>
              <th className="px-4 py-3 text-right">Total Sales</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {report.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="px-4 py-3 font-semibold">{item.partyName}</td>
                <td className="px-4 py-3 text-right">₹{item.totalPurchase?.toLocaleString('en-IN') || 0}</td>
                <td className="px-4 py-3 text-right">₹{item.totalSales?.toLocaleString('en-IN') || 0}</td>
                <td className={`px-4 py-3 text-right font-bold ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{item.balance?.toLocaleString('en-IN') || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartyWiseReportPage;