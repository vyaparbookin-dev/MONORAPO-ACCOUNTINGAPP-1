import React, { useState, useEffect } from "react";
import { Upload, FileText, Check, Loader2, ArrowRight, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Button from "../../components/Button";

const ParseBillFromImage = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [localProducts, setLocalProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      const res = await api.get('/api/inventory').catch(() => ({ data: { products: [] } }));
      setLocalProducts(res.data?.products || res.data || []);
    };
    loadProducts();
  }, []);

  // Smart Word Matching Algorithm
  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    if (s1.length === 0 || s2.length === 0) return 0;
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setParsedData(null);
    }
  };

  const handleScan = () => {
    if (!image) return;
    setScanning(true);

    // Simulate OCR Scanning Process
    setTimeout(() => {
      setScanning(false);
      // Mock Data - In real app, this comes from backend OCR
      setParsedData({
        supplierName: "Demo Supplier Enterprises",
        invoiceNumber: "INV-" + Math.floor(Math.random() * 10000),
        date: new Date().toISOString().split("T")[0],
        totalAmount: 15000,
        items: [
          { name: "Detected Item A", quantity: 10, price: 500 },
          { name: "Detected Item B", quantity: 5, price: 2000 },
        ],
      });
    }, 2000);
  };

  const handleConfirm = async () => {
    if (!parsedData) return;
    try {
      // Save as a purchase entry
      await api.post("/inventory/purchase", parsedData);
      alert("Purchase Entry Created Successfully!");
      navigate("/inventory");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save purchase entry.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="text-blue-600" /> Scan Purchase Bill
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Image Upload */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            {preview ? (
              <img src={preview} alt="Bill Preview" className="max-h-64 mx-auto rounded shadow-sm" />
            ) : (
              <div className="py-10 text-gray-400">
                <Upload size={48} className="mx-auto mb-2" />
                <p>Upload Bill Image</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="bill-upload"
            />
            <label
              htmlFor="bill-upload"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
            >
              {preview ? "Change Image" : "Select Image"}
            </label>
          </div>

          <Button
            onClick={handleScan}
            disabled={!image || scanning}
            className="w-full mt-4"
          >
            {scanning ? (
              <><Loader2 className="animate-spin" size={20} /> Scanning...</>
            ) : (
              "Extract Data"
            )}
          </Button>
        </div>

        {/* Right: Parsed Data Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4 border-b pb-2">Extracted Details</h3>
          
          {parsedData ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Supplier</label>
                <p className="font-medium">{parsedData.supplierName}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <label className="text-xs text-gray-500">Invoice No</label>
                  <p className="font-medium">{parsedData.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Date</label>
                  <p className="font-medium">{parsedData.date}</p>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <p className="text-sm text-green-800">Total Amount</p>
                <p className="text-xl font-bold text-green-700">₹{parsedData.totalAmount}</p>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-700">Items Scanned</h4>
                <div className="space-y-3">
                  {parsedData.items.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded border text-sm ${item.matchStatus === 'exact' ? 'bg-green-50 border-green-200' : item.matchStatus === 'partial' ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="font-bold text-gray-700">x{item.quantity}</span>
                      </div>
                      
                      {item.matchStatus === 'exact' && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Matched with inventory</p>}
                      {item.matchStatus === 'new' && <p className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14}/> Will be added as NEW</p>}

                      {item.matchStatus === 'partial' && (
                        <div className="mt-2 pt-2 border-t border-yellow-200">
                          <p className="text-xs text-yellow-800 mb-2"><AlertTriangle size={14} className="inline mr-1"/> {item.similarity}% Match: <strong>{item.suggestedProduct.name}</strong></p>
                          <div className="flex gap-2">
                            <button onClick={() => resolveItemConflict(idx, 'merge')} className="px-3 py-1 bg-yellow-600 text-white rounded text-xs">Merge</button>
                            <button onClick={() => resolveItemConflict(idx, 'keep_new')} className="px-3 py-1 border border-yellow-600 text-yellow-700 rounded text-xs">Add as New</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleConfirm} type="success" className="w-full mt-4">
                <Check size={20} /> Confirm & Save
              </Button>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <ArrowRight size={32} className="mx-auto mb-2 opacity-50" />
              <p>Scan an image to see details here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParseBillFromImage;