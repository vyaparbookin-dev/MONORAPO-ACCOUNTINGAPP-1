import React, { useState } from "react";
import { Upload, FileText, Check, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Button from "../../components/Button";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

const ParseBillFromImage = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [parsedData, setParsedData] = useState(null);

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
      const newId = crypto.randomUUID ? crypto.randomUUID() : `PUR-OCR-${Date.now()}`;
      const payload = { ...parsedData, _id: newId, uuid: newId, paymentMethod: 'credit' };

      // 1. Save Locally
      if (dbService.savePurchase) await dbService.savePurchase(payload);

      // 2. Try to update stock locally if products match by name
      const localProducts = await dbService.getInventory?.() || [];
      for (const item of payload.items) {
        const matchedProduct = localProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        if (matchedProduct) {
          const updatedProduct = { ...matchedProduct, currentStock: (parseFloat(matchedProduct.currentStock) || 0) + item.quantity };
          await dbService.updateProduct(matchedProduct._id, updatedProduct);
        }
      }

      await auditService.logAction('CREATE', 'purchase', null, payload);

      // 3. Queue for Cloud Sync
      await syncQueue.enqueue({ entityId: newId, entity: 'purchase', method: "POST", url: "/api/purchase", data: payload });

      alert("Purchase Entry Scanned & Saved Offline Successfully!");
      navigate("/inventory");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save purchase entry: " + error.message);
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