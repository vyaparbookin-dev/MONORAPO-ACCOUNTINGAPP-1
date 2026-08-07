import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function EWayBillPage() {
  const [docs, setDocs] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedBill, setSelectedBill] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  const fetchData = async () => {
    try {
      const [ewayRes, billsRes] = await Promise.all([
        api.get('/api/ewaybill'),
        api.get('/api/billing?limit=50')
      ]);
      setDocs(ewayRes.data?.data || []);
      setBills(billsRes.data?.bills || billsRes.data?.data || []);
    } catch (error) {
      console.error("Error fetching E-Way Bills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedBill) return alert("Please select an invoice.");
    
    setGenerating(true);
    try {
      await api.post('/api/ewaybill/generate', {
        billId: selectedBill,
        vehicleNumber: vehicleNo,
        isEInvoice: true // Requesting both EWB and IRN
      });
      alert("E-Way Bill & E-Invoice Generated Successfully!");
      setSelectedBill('');
      setVehicleNo('');
      fetchData();
    } catch (error) {
      alert("Generation failed: " + (error.response?.data?.message || error.message));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">E-Way Bill & E-Invoicing (Govt API)</h1>
          <p className="text-gray-500 mb-6">Generate e-way bills and IRN for invoices exceeding ₹50,000.</p>
          
          <form onSubmit={handleGenerate} className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded border">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Pending Invoice</label>
              <select 
                required
                className="w-full border p-2 rounded" 
                value={selectedBill} 
                onChange={(e) => setSelectedBill(e.target.value)}
              >
                <option value="">-- Choose Invoice --</option>
                {bills.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.billNumber || b.billNo} - {b.customerName} (₹{b.total || b.finalAmount})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input 
                type="text" 
                placeholder="e.g. MH-01-AB-1234" 
                className="w-full border p-2 rounded uppercase" 
                value={vehicleNo} 
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              />
            </div>
            <button 
              type="submit" 
              disabled={generating || !selectedBill}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
            >
              {generating ? "Connecting to NIC..." : "Generate E-Way Bill"}
            </button>
          </form>
        </div>

        {/* Generated Bills List */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Generated E-Way Bills & IRNs</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 border-b">Invoice No</th>
                    <th className="py-3 px-4 border-b">E-Way Bill No (12 Digit)</th>
                    <th className="py-3 px-4 border-b">IRN (E-Invoice Ref)</th>
                    <th className="py-3 px-4 border-b">Generated On</th>
                    <th className="py-3 px-4 border-b">Valid Upto</th>
                    <th className="py-3 px-4 border-b text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 && <tr><td colSpan="6" className="text-center py-6 text-gray-500">No generated records.</td></tr>}
                  {docs.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50 border-b">
                      <td className="py-3 px-4 font-semibold text-gray-800">{doc.invoiceNumber}</td>
                      <td className="py-3 px-4 font-mono text-blue-600 font-bold">{doc.ewayBillNumber}</td>
                      <td className="py-3 px-4 font-mono text-xs max-w-[150px] truncate" title={doc.irn}>{doc.irn || "N/A"}</td>
                      <td className="py-3 px-4">{new Date(doc.generatedDate).toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600 font-medium">{new Date(doc.validUpto).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-bold uppercase">{doc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}