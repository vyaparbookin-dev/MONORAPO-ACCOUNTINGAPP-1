import React, { useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const Gstr3bReportPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = {};
      if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
      }
      const res = await api.post("/report/generate", { type: "gstr3b", filter });
      setReport(res.report || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch GSTR-3B report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">GSTR-3B / Quarterly Summary</h1>
          <p className="text-sm text-gray-600">Summary of GST liabilities and collections</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchReport} className="bg-blue-600 text-white px-4 py-2 rounded">Generate</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-2 rounded" />
          </div>
        </div>
      </div>

      {loading && <Loader />}
      {error && <div className="text-red-600">{error}</div>}

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <div className="text-sm text-gray-600">Taxable Value</div>
            <div className="text-2xl font-bold">₹{(report.totalTaxable || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <div className="text-sm text-gray-600">CGST</div>
            <div className="text-2xl font-bold">₹{(report.totalCGST || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <div className="text-sm text-gray-600">SGST</div>
            <div className="text-2xl font-bold">₹{(report.totalSGST || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded">
            <div className="text-sm text-gray-600">IGST</div>
            <div className="text-2xl font-bold">₹{(report.totalIGST || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <div className="text-sm text-gray-600">Total GST</div>
            <div className="text-2xl font-bold">₹{(report.totalGST || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {!report && !loading && <div className="text-gray-500">No report generated yet.</div>}
    </div>
  );
};

export default Gstr3bReportPage;
