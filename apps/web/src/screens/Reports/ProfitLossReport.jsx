import React, { useEffect, useState } from "react";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const ProfitLossReportPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // The API returns an object with a 'data' property containing the report
      const response = await api.get("/api/reports/profitloss");
      if (response.success) {
        setReport(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch report data.");
      }
    } catch (error) {
      console.error("Error fetching profit/loss report:", error);
      setError(error.message || "Failed to fetch report. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Profit & Loss Statement</h1>
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Refresh
          </button>
        </div>

        {loading && <Loader />}
        {error && <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg">{error}</div>}
        
        {report && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <p className="text-sm text-green-800 font-semibold flex items-center gap-2"><TrendingUp size={16}/> Total Revenue (Sales)</p>
                <p className="text-3xl font-bold text-green-700 mt-2">₹{report.totalSales.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <p className="text-sm text-red-800 font-semibold flex items-center gap-2"><TrendingDown size={16}/> Total Expenses</p>
                <p className="text-3xl font-bold text-red-700 mt-2">₹{report.totalExpenses.toLocaleString('en-IN')}</p>
              </div>
              <div className={`p-6 rounded-xl border ${report.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${report.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}><DollarSign size={16}/> Net Profit / Loss</p>
                <p className={`text-3xl font-bold mt-2 ${report.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>₹{report.netProfit.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">Total Revenue from Sales</span>
                  <span className="font-bold text-green-600">+ ₹{report.totalSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">Total Purchases</span>
                  <span className="font-semibold text-red-600">- ₹{report.totalPurchase.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="font-medium text-gray-700">Total Other Expenses</span>
                  <span className="font-semibold text-red-600">- ₹{report.totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="text-lg font-bold">Net Profit / Loss</span>
                  <span className={`text-lg font-extrabold ${report.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    ₹{report.netProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitLossReportPage;