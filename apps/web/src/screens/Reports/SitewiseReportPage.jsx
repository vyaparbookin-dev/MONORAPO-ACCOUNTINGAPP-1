import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const SitewiseReportPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month"); // Default filter
  const [selectedSite, setSelectedSite] = useState(""); // Filter by specific site

  const dateRanges = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Year", value: "year" },
    { label: "All Time", value: "all" }
  ];

  // Dummy list of sites for filter dropdown
  // In a real app, this would come from an API or be dynamically generated from existing bills
  const dummySites = ["Main Branch", "Construction Site A", "Remote Project X", "Warehouse Y", "Unknown Site"];


  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { 
          type: "sitewise", 
          dateRange: dateRange 
      };
      if (selectedSite) {
        payload.siteName = selectedSite;
      }
      
      const res = await api.post("/report/generate", payload);
      const d = res.reports || res.data || res;
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch sitewise report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, selectedSite]); // Refetch when filters change

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Sitewise Report</h1>
          <p className="text-sm text-gray-600">Summary of transactions per site/location</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded">Refresh</button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading && <Loader />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRanges.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Site</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="">All Sites</option>
              {dummySites.map(site => <option key={site} value={site}>{site}</option>)}
            </select>
          </div>
        </div>
      </div>


      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Site Name</th>
              <th className="px-4 py-3 text-right">Total Bills</th>
              <th className="px-4 py-3 text-right">Total Amount</th>
              <th className="px-4 py-3 text-right">Total Tax</th>
              <th className="px-4 py-3 text-left">Items Sold (Qty, Value)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No data available</td>
              </tr>
            )}
            {data.map((row, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-3 font-semibold">{row.siteName}</td>
                <td className="px-4 py-3 text-right">{row.totalBills}</td>
                <td className="px-4 py-3 text-right">₹{(row.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-right">₹{(row.totalTax || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-left text-xs">
                    {row.itemsSold && row.itemsSold.map((item, i) => (
                        <p key={i}>{item.name} ({item.totalQuantity} units, ₹{item.totalValue.toLocaleString('en-IN')})</p>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SitewiseReportPage;
