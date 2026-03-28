import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import api from "../../services/api";
import { dbService } from "../../services/dbService";

// Local format date helper in case shared one is inaccessible offline
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString();
};

export default function SupplierLedgerPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
        try {
            // Offline First: Try loading from local DB
            let localParties = await dbService.getCustomers?.() || [];
            if (!localParties || localParties.length === 0) {
                const res = await api.get("/api/party").catch(() => ({ data: { parties: [] } }));
                localParties = res.data?.parties || [];
            }
            // Filter only suppliers
            const supps = localParties.filter(p => p.partyType === 'supplier' || p.partyType === 'both');
            setSuppliers(supps);
        } catch (e) {
            console.error(e);
        }
    };
    fetchSuppliers();
  }, []);

  const fetchLedger = async () => {
    if (!selectedSupplier) return;
    setLoading(true);
    try {
      // Try to fetch from API first if online
      const res = await api.get(`/api/party/${selectedSupplier}/ledger`).catch(() => null);
      
      if (res && res.data && (res.data.ledger || Array.isArray(res.data))) {
         setLedgerData(res.data.ledger || res.data || []);
      } else {
         // Offline Fallback: Construct ledger from local purchases
         const localPurchases = await dbService.getPurchases?.() || [];
         const supplierPurchases = localPurchases.filter(p => p.partyId === selectedSupplier);
         
         const ledger = supplierPurchases.map(p => ({
             date: p.date,
             type: 'purchase',
             refNo: p.purchaseNumber || p._id,
             debit: p.amountPaid || 0,
             credit: p.finalAmount || 0,
             balance: (p.finalAmount || 0) - (p.amountPaid || 0)
         }));
         
         setLedgerData(ledger);
      }
    } catch (err) {
      console.error("Failed to fetch ledger", err);
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Ledger</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
          <select 
            className="w-full border p-2 rounded-lg"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">-- Choose Supplier --</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={fetchLedger}
          disabled={!selectedSupplier}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          View Ledger
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Date</th>
              <th className="p-4 font-semibold text-gray-600">Transaction Type</th>
              <th className="p-4 font-semibold text-gray-600">Reference No</th>
              <th className="p-4 text-right font-semibold text-gray-600">Debit (Paid)</th>
              <th className="p-4 text-right font-semibold text-gray-600">Credit (Purchase)</th>
              <th className="p-4 text-right font-semibold text-gray-600">Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center">Loading...</td></tr>
            ) : ledgerData.length > 0 ? (
              ledgerData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-4">{formatDate(row.date)}</td>
                  <td className="p-4 capitalize">{row.type}</td>
                  <td className="p-4">{row.refNo}</td>
                  <td className="p-4 text-right text-green-600">{row.debit ? `₹${row.debit}` : '-'}</td>
                  <td className="p-4 text-right text-red-600">{row.credit ? `₹${row.credit}` : '-'}</td>
                  <td className="p-4 text-right font-bold">₹{row.balance}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">No transactions found for this supplier.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}