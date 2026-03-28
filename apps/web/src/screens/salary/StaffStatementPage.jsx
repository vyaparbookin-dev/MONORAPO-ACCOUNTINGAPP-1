import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { FileText, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function StaffStatementPage() {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get("/api/staff");
        setStaffList(res.data?.staff || []);
      } catch (err) {
        console.error("Failed to load staff", err);
      }
    };
    fetchStaff();
  }, []);

  const fetchStatement = async () => {
    if (!selectedStaff) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/staff/${selectedStaff}/statement`);
      setTransactions(res.data?.transactions || []);
    } catch (err) {
      console.error("Failed to fetch statement", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const currentStaff = staffList.find((s) => s._id === selectedStaff);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <FileText className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Statement / Ledger</h1>
          <p className="text-gray-500 text-sm">View complete history of attendance, advance, and salary payments.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
          <select className="w-full border p-3 rounded-lg bg-gray-50" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
            <option value="">-- Choose Employee --</option>
            {staffList.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
          </select>
        </div>
        <button onClick={fetchStatement} disabled={!selectedStaff || loading} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-full md:w-auto">
          {loading ? "Loading..." : "Get Statement"}
        </button>
      </div>

      {currentStaff && (
        <div className={`p-4 rounded-xl border mb-6 flex justify-between items-center ${currentStaff.balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Current Balance for {currentStaff.name}</h2>
            <p className="text-sm text-gray-600">
              {currentStaff.balance >= 0 ? 'Payable to Staff (Salary Due)' : 'Advance Given to Staff (To be Recovered)'}
            </p>
          </div>
          <div className={`text-3xl font-extrabold ${currentStaff.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ₹{Math.abs(currentStaff.balance || 0)}
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Details / Notes</th>
                <th className="p-4 font-semibold text-right">Debit (Advance/Paid)</th>
                <th className="p-4 font-semibold text-right">Credit (Salary Due)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-gray-700">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className="capitalize font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm">
                      {t.type.replace('_', ' ')}
                    </span>
                    {t.status && <span className="ml-2 text-xs text-gray-500 capitalize">({t.status})</span>}
                  </td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{t.notes || '-'}</td>
                  <td className="p-4 text-right font-bold text-red-600">
                    {t.debit > 0 ? <span className="flex items-center justify-end gap-1"><ArrowDownCircle size={14}/> ₹{t.debit}</span> : '-'}
                  </td>
                  <td className="p-4 text-right font-bold text-green-600">
                    {t.credit > 0 ? <span className="flex items-center justify-end gap-1"><ArrowUpCircle size={14}/> ₹{t.credit}</span> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedStaff && transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">No transactions found for this staff member.</div>
      )}
    </div>
  );
}