import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { useCompany } from "../../contexts/CompanyContext";

export default function BillDetailPage({ bill: propBill, onBack }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(propBill || null);
  const [loading, setLoading] = useState(!propBill);
  const [error, setError] = useState(null);

  const { selectedCompany } = useCompany();
  const gstType = selectedCompany?.gstType || "regular";
  const isComposition = String(gstType).toLowerCase() === "composition";

  useEffect(() => {
    if (!bill && id) {
      fetchBill(id);
    }
  }, [id, bill]);

  const fetchBill = async (billId) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/billing/${billId}`);
      setBill(res.bill || res);
    } catch (err) {
      console.error(err);
      setError("Failed to load bill details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!bill) return;
    try {
      const res = await api.get(`/api/billing/${bill._id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bill.billNumber || bill.billNo || 'invoice'}.pdf`;
      a.click();
    } catch (e) {
      alert("Failed to download PDF");
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="p-6 text-red-600 bg-white rounded-xl shadow">{error}</div>;
  if (!bill) return <div className="p-6 text-gray-600 bg-white rounded-xl shadow">Bill not found</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto my-6">
      {isComposition && (
        <div className="mb-6 p-2 bg-gray-100 border border-gray-400 rounded text-gray-800 text-sm font-bold text-center uppercase tracking-wide">
          Composition Scheme
        </div>
      )}
      <button 
        onClick={onBack || (() => navigate("/billing"))} 
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        ← Back to List
      </button>
      
      <div className="flex justify-between items-start mb-6 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {bill.billNumber || bill.billNo}</h1>
          <p className="text-gray-500">Created on {new Date(bill.date || bill.createdAt).toLocaleDateString()}</p>
        </div>
        <div className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${
          bill.status === 'paid' ? 'bg-green-100 text-green-800' : 
          bill.status === 'issued' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {bill.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
          <p className="font-medium text-lg">{bill.customerName}</p>
          {bill.customerMobile && <p className="text-gray-600">{bill.customerMobile}</p>}
          {bill.customerAddress && <p className="text-gray-600">{bill.customerAddress}</p>}
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Total Amount</h3>
          <p className="text-3xl font-bold text-blue-600">₹{(bill.total || bill.totalAmount || 0).toLocaleString()}</p>
          {bill.dueDate && <p className="text-sm text-red-500 mt-1">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>}
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 font-semibold text-gray-600">Item</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Qty</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Rate</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items && bill.items.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-3 px-4">
                  <div className="font-medium">{item.name}</div>
                  {(item.serialNumber || item.warranty) && (
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      {item.serialNumber && <span><strong className="text-gray-700">SN/IMEI:</strong> {item.serialNumber}</span>}
                      {item.warranty && <span><strong className="text-gray-700">Warranty:</strong> {item.warranty}</span>}
                    </div>
                  )}
                  {(item.batchNumber || item.mfgDate || item.expiryDate) && (
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      {item.batchNumber && <span><strong className="text-gray-700">Batch:</strong> {item.batchNumber}</span>}
                      {item.mfgDate && <span><strong className="text-gray-700">Mfg:</strong> {item.mfgDate}</span>}
                      {item.expiryDate && <span><strong className="text-red-600">Exp:</strong> <span className="text-red-500 font-medium">{item.expiryDate}</span></span>}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right">{item.quantity} {item.unit}</td>
                <td className="py-3 px-4 text-right">₹{item.rate || item.price}</td>
                <td className="py-3 px-4 text-right font-medium">₹{item.total || ((item.rate || item.price) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic UPI QR Code Section */}
      {bill.paymentQrCode && (
        <div className="flex justify-end mb-8">
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg shadow-sm bg-white w-max">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Scan & Pay via UPI</h3>
            <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
              <img 
                src={bill.paymentQrCode} 
                alt="UPI QR Code" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Amount: <span className="font-bold text-gray-800">₹{(bill.finalAmount || bill.total || bill.totalAmount || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}