import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { Download, FileText, CheckCircle } from "lucide-react";

const GstReportPage = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("GSTR1");
  const [gstData, setGstData] = useState(null);

  // Month selection for proper reporting
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchGstReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/gst/report?month=${month}&year=${year}`);
      setGstData(response.data?.data);
    } catch (error) {
      console.error("Error fetching GST report:", error);
      setError(error.response?.data?.message || "Failed to fetch GST report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGstReport();
  }, [month, year]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="text-blue-600"/> GST Filing Reports</h1>
          <p className="text-gray-600 mt-1 text-sm">GSTR-1, GSTR-2, and GSTR-3B Summary</p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <select className="border border-gray-300 rounded p-2 outline-none" value={month} onChange={e => setMonth(e.target.value)}>
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select className="border border-gray-300 rounded p-2 outline-none" value={year} onChange={e => setYear(e.target.value)}>
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchGstReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Refresh
          </button>
        </div>
      </div>

      {loading && <Loader />}
      
      {/* Tabs */}
      {!loading && gstData && (
        <>
          <div className="flex border-b border-gray-300">
            <button onClick={() => setActiveTab("GSTR1")} className={`py-3 px-6 font-semibold ${activeTab === 'GSTR1' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>GSTR-1 (Sales)</button>
            <button onClick={() => setActiveTab("GSTR2")} className={`py-3 px-6 font-semibold ${activeTab === 'GSTR2' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>GSTR-2 (Purchases)</button>
            <button onClick={() => setActiveTab("GSTR3B")} className={`py-3 px-6 font-semibold ${activeTab === 'GSTR3B' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>GSTR-3B (Summary)</button>
          </div>

          {activeTab === 'GSTR1' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">B2B Invoices (Business to Business)</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Total GST Liability: ₹{(gstData.gstr1.totalGst || 0).toFixed(2)}</span>
              </div>
              <DataTable records={gstData.gstr1.b2b} type="Sales" emptyMsg="No B2B sales found this month." />

              <h3 className="font-bold text-lg mt-8 mb-4 border-t pt-4">B2C Invoices (Business to Customer)</h3>
              <DataTable records={gstData.gstr1.b2c} type="Sales" emptyMsg="No B2C sales found." />
            </div>
          )}

          {activeTab === 'GSTR2' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Inward Supplies (B2B Purchases)</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">Total Input Tax Credit (ITC): ₹{(gstData.gstr2.totalGst || 0).toFixed(2)}</span>
              </div>
              <DataTable records={gstData.gstr2.b2b} type="Purchases" emptyMsg="No purchases recorded." />
            </div>
          )}

          {activeTab === 'GSTR3B' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
                <p className="text-gray-500 mb-1">Total Output Tax (Sales)</p>
                <p className="text-3xl font-bold text-red-600">₹{(gstData.gstr3b.outwardGst || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center shadow-sm">
                <p className="text-gray-500 mb-1">Total Input Tax Credit (Purchases)</p>
                <p className="text-3xl font-bold text-green-600">₹{(gstData.gstr3b.inwardGst || 0).toFixed(2)}</p>
              </div>
              <div className={`p-6 rounded-xl border text-center shadow-sm ${gstData.gstr3b.netGstPayable > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className={`font-semibold mb-1 ${gstData.gstr3b.netGstPayable > 0 ? 'text-red-700' : 'text-green-700'}`}>Net GST Payable to Govt.</p>
                <p className={`text-4xl font-extrabold ${gstData.gstr3b.netGstPayable > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Math.max(gstData.gstr3b.netGstPayable, 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

const DataTable = ({ records, type, emptyMsg }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-50 border-y">
        <tr>
          <th className="p-3 font-semibold text-gray-600 text-sm">Invoice No</th>
          <th className="p-3 font-semibold text-gray-600 text-sm">Date</th>
          <th className="p-3 font-semibold text-gray-600 text-sm">{type === 'Sales' ? 'Customer' : 'Supplier'}</th>
          <th className="p-3 font-semibold text-gray-600 text-sm">GSTIN</th>
          <th className="p-3 font-semibold text-gray-600 text-sm text-right">Taxable Value</th>
          <th className="p-3 font-semibold text-gray-600 text-sm text-right">GST Amount</th>
          <th className="p-3 font-semibold text-gray-600 text-sm text-right">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        {records.length === 0 ? <tr><td colSpan="7" className="p-6 text-center text-gray-500">{emptyMsg}</td></tr> : null}
        {records.map((r, i) => (
          <tr key={i} className="border-b hover:bg-gray-50">
            <td className="p-3 text-sm font-medium">{r.invoiceNo}</td>
            <td className="p-3 text-sm">{new Date(r.date).toLocaleDateString()}</td>
            <td className="p-3 text-sm">{r.customer || r.supplier}</td>
            <td className="p-3 text-sm font-mono text-gray-600">{r.gstin}</td>
            <td className="p-3 text-sm text-right text-gray-700">₹{r.taxableValue.toFixed(2)}</td>
            <td className="p-3 text-sm text-right text-purple-600 font-semibold">₹{r.gstAmount.toFixed(2)}</td>
            <td className="p-3 text-sm text-right font-bold">₹{r.totalValue.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default GstReportPage;