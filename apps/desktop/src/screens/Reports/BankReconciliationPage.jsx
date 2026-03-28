import React, { useState } from 'react';
import api from '../../services/api';

export default function BankReconciliationPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  // Parse CSV File and send to Backend
  const handleUploadAndReconcile = () => {
    if (!file) return alert("Please select a CSV file first!");

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const statementEntries = [];

      // Standard Bank CSV Format assume kar rahe hain: Date, Description, Debit, Credit
      // Skip Header (i=1)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple comma split (Dhyan rahe description me comma na ho, warna aage advance parser laga sakte hain)
        const cols = line.split(',');
        if (cols.length >= 4) {
          const date = cols[0];
          const description = cols[1];
          const debit = parseFloat(cols[2]) || 0;
          const credit = parseFloat(cols[3]) || 0;

          if (debit > 0) {
            statementEntries.push({ date, description, amount: debit, type: 'debit' }); // Bank se paise kate
          } else if (credit > 0) {
            statementEntries.push({ date, description, amount: credit, type: 'credit' }); // Bank me paise aaye
          }
        }
      }

      try {
        // API Call
        const response = await api.post('/api/bank-rec/reconcile', { statementEntries });
        if (response.data.success) {
          setResults({
            matched: response.data.matched,
            unmatched: response.data.unmatched
          });
        }
      } catch (error) {
        console.error(error);
        alert("Error during reconciliation: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Bank Statement Reconciliation</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-sm text-blue-700">
          <p className="font-semibold">Instructions:</p>
          <p>Upload a CSV file of your bank statement. Columns should strictly be in this order: <strong>Date (YYYY-MM-DD), Description, Debit Amount, Credit Amount</strong>.</p>
        </div>

        {/* Upload Section */}
        <div className="flex items-center space-x-4 mb-8">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md"
          />
          <button 
            onClick={handleUploadAndReconcile}
            disabled={loading || !file}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Processing...' : 'Run Auto-Tally'}
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-8">
            {/* Unmatched Entries (Missing in Software) */}
            <div>
              <h2 className="text-xl font-semibold text-red-600 mb-3 border-b pb-2">
                Unmatched Entries ({results.unmatched.length})
              </h2>
              <p className="text-sm text-gray-500 mb-2">Ye entries aapke bank me hain par app me nahi daali gayi hain. Kripya inki entry karein.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-red-50 text-red-700 text-left">
                    <tr>
                      <th className="py-2 px-4 border-b">Date</th>
                      <th className="py-2 px-4 border-b">Description</th>
                      <th className="py-2 px-4 border-b">Type</th>
                      <th className="py-2 px-4 border-b">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.unmatched.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{item.date}</td>
                        <td className="py-2 px-4 border-b">{item.description}</td>
                        <td className="py-2 px-4 border-b">
                          <span className={`px-2 py-1 rounded text-xs ${item.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b font-semibold">{item.amount}</td>
                      </tr>
                    ))}
                    {results.unmatched.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-gray-500">No unmatched entries found!</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matched Entries */}
            <div>
              <h2 className="text-xl font-semibold text-green-600 mb-3 border-b pb-2">
                Matched Entries ({results.matched.length})
              </h2>
              <p className="text-sm text-gray-500 mb-2">Ye entries bank aur software dono jagah exactly match ho gayi hain.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-green-50 text-green-700 text-left">
                    <tr>
                      <th className="py-2 px-4 border-b">Bank Date</th>
                      <th className="py-2 px-4 border-b">Bank Description</th>
                      <th className="py-2 px-4 border-b">Matched With (Software)</th>
                      <th className="py-2 px-4 border-b">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.matched.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{item.statementEntry.date}</td>
                        <td className="py-2 px-4 border-b">{item.statementEntry.description}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-600">
                          {item.matchDetails.model} - {item.matchDetails.data?.details || item.matchDetails.data?.title}
                        </td>
                        <td className="py-2 px-4 border-b font-semibold text-green-700">{item.statementEntry.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}