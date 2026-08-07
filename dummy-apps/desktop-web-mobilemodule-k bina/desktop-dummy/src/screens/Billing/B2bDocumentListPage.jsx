import React, { useEffect, useState } from "react";
import { FileText, RefreshCw, CheckCircle } from "lucide-react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { dbService } from "../../services/dbService";
import { syncQueue } from "@repo/shared";
import { auditService } from "../../services/auditService";

export default function B2bDocumentListPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Offline first fetch
      let localDocs = await dbService.getB2bDocuments?.() || [];
      
      if (!localDocs || localDocs.length === 0) {
          const res = await api.get("/api/b2b").catch(() => ({ data: { data: [] } }));
          localDocs = res.data?.data || [];
      }
      
      setDocuments(localDocs);
    } catch (err) {
      console.error(err);
      alert("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToBill = async (id) => {
    if (!window.confirm("Are you sure you want to convert this to a final Invoice/Bill?")) return;
    
    try {
      // Offline support for conversion
      if (dbService.updateB2bDocument) await dbService.updateB2bDocument(id, { status: "converted" });
      await auditService.logAction('UPDATE', 'b2b_document_convert', { _id: id }, { status: "converted" });
      await syncQueue.enqueue({ entityId: id, entity: 'b2b_document', method: 'POST', url: `/api/b2b/${id}/convert` });
      
      alert("Successfully converted to Final Invoice (Offline Queued)!");
      fetchDocuments(); // Refresh list
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to convert document.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800"><FileText className="text-blue-600"/> B2B Documents</h1>
          <p className="text-gray-600">Manage Quotations, Sales Orders & Delivery Challans</p>
        </div>
        <button onClick={() => navigate("/billing/b2b/create")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Create New Document
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Doc Number</th>
              <th className="p-4 font-semibold text-gray-600">Type</th>
              <th className="p-4 font-semibold text-gray-600">Customer</th>
              <th className="p-4 font-semibold text-gray-600">Date</th>
              <th className="p-4 font-semibold text-gray-600">Amount</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Status / Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr> : null}
            {!loading && documents.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">No documents found.</td></tr>}
            
            {documents.map((doc) => (
              <tr key={doc._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{doc.documentNumber}</td>
                <td className="p-4 capitalize text-blue-700 font-semibold">{doc.type.replace('_', ' ')}</td>
                <td className="p-4">{doc.partyId?.name || "Unknown"}</td>
                <td className="p-4">{new Date(doc.date).toLocaleDateString()}</td>
                <td className="p-4 font-bold text-gray-800">₹{doc.finalAmount}</td>
                <td className="p-4 text-center">
                  {doc.status === "converted" ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm"><CheckCircle size={16}/> Converted</span>
                  ) : (
                    <button onClick={() => handleConvertToBill(doc._id)} className="flex items-center justify-center gap-1 mx-auto bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm font-medium transition">
                      <RefreshCw size={14} /> Convert to Bill
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}