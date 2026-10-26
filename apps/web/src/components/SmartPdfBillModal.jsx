import React, { useState, useRef } from "react";
import { extractPagesAndBillsFromPDF } from "../utils/PdfParser";
import { storageManager } from "../services/storageManager";

export default function SmartPdfBillModal({ isOpen, onClose, onBillsSaved, companyId }) {
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("कृपया सिर्फ PDF फाइल चुनें (.pdf format)");
      return;
    }

    setLoading(true);
    setPages([]);

    try {
      const extractedPages = await extractPagesAndBillsFromPDF(file);
      if (extractedPages.length === 0) {
        alert("इस PDF में कोई पेज नहीं मिला।");
      } else {
        setPages(extractedPages);
      }
    } catch (err) {
      console.error("PDF Parsing error:", err);
      alert("PDF को पढ़ने में समस्या आई। कृपया फाइल चेक करें।");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index, field, value) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleSelectPage = (index) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isSelected: !updated[index].isSelected };
      return updated;
    });
  };

  const handleSaveAllBills = async () => {
    const selected = pages.filter((p) => p.isSelected);
    if (selected.length === 0) {
      alert("कम से कम 1 बिल सेलेक्ट करें।");
      return;
    }

    setSaving(true);
    const createdBills = [];
    const coId = companyId || localStorage.getItem("companyId") || "default";

    try {
      // 1. Load persistent photo cache
      let photosCache = {};
      try {
        photosCache = JSON.parse(localStorage.getItem("vb_tx_photos_cache") || "{}");
      } catch (e) {}

      // 2. Loop through each selected page bill
      for (const page of selected) {
        const uniqueId = `pdf_${Date.now()}_${page.pageNumber}_${Math.random().toString(36).substring(2, 6)}`;
        const billAmt = Number(page.totalAmount) || 0;

        const newBill = {
          _id: uniqueId,
          id: uniqueId,
          billNumber: page.billNumber || `BILL-P${page.pageNumber}`,
          invoiceNumber: page.billNumber || `BILL-P${page.pageNumber}`,
          customerName: page.partyName || `Party Page ${page.pageNumber}`,
          partyName: page.partyName || `Party Page ${page.pageNumber}`,
          date: page.date || new Date().toISOString().split("T")[0],
          total: billAmt,
          finalAmount: billAmt,
          paidAmount: 0,
          balance: billAmt,
          paymentStatus: "Unpaid",
          type: "Purchase",
          source: "PDF_MULTI_IMPORT",
          imgUrls: page.imageUrl ? [page.imageUrl] : [],
          items: [
            {
              name: `Items from PDF Page ${page.pageNumber}`,
              qty: 1,
              rate: billAmt,
              amount: billAmt,
            },
          ],
        };

        // Cache page photo permanently so it shows in the bill gallery
        if (page.imageUrl) {
          photosCache[uniqueId] = [page.imageUrl];
          photosCache[newBill.billNumber] = [page.imageUrl];
        }

        // Save through storageManager
        storageManager.saveBill(coId, newBill);
        createdBills.push(newBill);
      }

      // Persist photo cache
      try {
        localStorage.setItem("vb_tx_photos_cache", JSON.stringify(photosCache));
      } catch (e) {}

      // Notify parent app
      if (onBillsSaved) {
        onBillsSaved(createdBills);
      }

      alert(`✅ ${createdBills.length} बिल सफलतापूर्वक खाते में दर्ज किए गए और मूल फोटो साथ में सेव कर दी गई!`);
      onClose();
    } catch (err) {
      console.error("Save bills error:", err);
      alert("बिल सेव करते समय एरर आया: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">स्मार्ट Multi-Page PDF बिल इंपोर्टर</h3>
              <p className="text-xs text-indigo-100">एक ही PDF से सभी बिल अलग-अलग पहचानें और फोटो प्रूफ के साथ दर्ज करें</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* File Picker / Dropzone */}
          {pages.length === 0 && !loading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px]"
            >
              <span className="text-5xl mb-3">📑</span>
              <h4 className="font-bold text-gray-800 text-base mb-1">अपने बिल की PDF फाइल चुनें</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                यदि 1 PDF में 2, 5 या 10 अलग-अलग बिल हैं, तो यह सिस्टम हर पेज को अलग फोटो बनाएगा और जानकारी खुद पढ़ लेगा।
              </p>
              <button
                type="button"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
              >
                PDF अपलोड करें
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />

          {/* Loading state */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h4 className="font-bold text-gray-800 text-base">PDF को पेजों में बांटा जा रहा है...</h4>
              <p className="text-xs text-gray-500 mt-1">हर पेज की HD फोटो और बिल डिटेल्स (पार्टी, तारीख, अमाउंट) पढ़ी जा रही है।</p>
            </div>
          )}

          {/* Pages / Bills List */}
          {pages.length > 0 && !loading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-sm font-bold text-gray-800">
                  कुल <span className="text-indigo-600 font-extrabold">{pages.length}</span> पेज / बिल पहचाने गए
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                >
                  दूसरी PDF बदलें
                </button>
              </div>

              {pages.map((p, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-3.5 transition ${
                    p.isSelected
                      ? "border-indigo-400 bg-white shadow-sm"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Thumbnail Preview */}
                    <div className="relative group shrink-0 w-full sm:w-28 h-36 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                      <img
                        src={p.imageUrl}
                        alt={`Page ${p.pageNumber}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewImage(p.imageUrl)}
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(p.imageUrl)}
                        className="absolute inset-0 bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition font-semibold"
                      >
                        🔍 बड़ा देखें
                      </button>
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        P-{p.pageNumber}
                      </span>
                    </div>

                    {/* Form Fields for this Bill */}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.isSelected}
                            onChange={() => toggleSelectPage(idx)}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-xs font-bold text-gray-800">
                            पेज {p.pageNumber} को बिल के रूप में दर्ज करें
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-gray-500 font-medium">पार्टी / सप्लायर नाम</label>
                          <input
                            type="text"
                            value={p.partyName}
                            onChange={(e) => handleFieldChange(idx, "partyName", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800"
                            placeholder="सप्लायर का नाम"
                          />
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium">बिल / इनवॉइस नंबर</label>
                          <input
                            type="text"
                            value={p.billNumber}
                            onChange={(e) => handleFieldChange(idx, "billNumber", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800"
                            placeholder="बिल नं"
                          />
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium">तारीख (Bill Date)</label>
                          <input
                            type="date"
                            value={p.date}
                            onChange={(e) => handleFieldChange(idx, "date", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-gray-800"
                          />
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium">कुल रकम (₹ Total Amount)</label>
                          <input
                            type="number"
                            value={p.totalAmount}
                            onChange={(e) => handleFieldChange(idx, "totalAmount", e.target.value)}
                            disabled={!p.isSelected}
                            className="w-full mt-0.5 px-2.5 py-1.5 border border-indigo-400 bg-indigo-50/30 rounded-md focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700 text-sm"
                            placeholder="₹ 0.00"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 font-semibold transition"
          >
            रद्द करें
          </button>

          {pages.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAllBills}
              disabled={saving || pages.filter((p) => p.isSelected).length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-md transition flex items-center gap-2"
            >
              {saving ? "सेव हो रहा है..." : `💾 सभी ${pages.filter((p) => p.isSelected).length} बिल दर्ज करें (फोटो सहित)`}
            </button>
          )}
        </div>

      </div>

      {/* Full Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Bill Full Preview"
              className="max-h-[85vh] w-auto rounded-lg shadow-2xl object-contain bg-white"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/90 font-bold"
            >
              ✕ बंद करें
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
