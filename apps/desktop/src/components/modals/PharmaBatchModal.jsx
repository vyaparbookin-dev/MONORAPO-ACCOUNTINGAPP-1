import React, { useState, useEffect } from "react";
import { X, Pill, AlertTriangle, Calendar, Plus, CheckCircle, ShieldAlert } from "lucide-react";

export default function PharmaBatchModal({ isOpen, onClose, onApplyItem, inventory = [] }) {
  const [medicineName, setMedicineName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [packType, setPackType] = useState("strip"); // strip or loose_tablet
  const [tabletsPerStrip, setTabletsPerStrip] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [stripRate, setStripRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [isScheduleH, setIsScheduleH] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [patientName, setPatientName] = useState("");

  if (!isOpen) return null;

  // Calculate rate per tablet if loose
  const calculatedRate = packType === "strip" 
    ? (parseFloat(stripRate) || 0) 
    : ((parseFloat(stripRate) || 0) / (parseInt(tabletsPerStrip) || 10));

  const totalAmount = Math.round(calculatedRate * (parseFloat(quantity) || 1));

  // Check near expiry
  const checkNearExpiry = (exp) => {
    if (!exp) return false;
    const parts = exp.split('/');
    if (parts.length === 2) {
      const expMonth = parseInt(parts[0], 10);
      const expYear = parseInt('20' + parts[1].slice(-2), 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const monthsLeft = (expYear - currentYear) * 12 + (expMonth - currentMonth);
      return monthsLeft <= 3;
    }
    return false;
  };

  const isNearExpiry = checkNearExpiry(expiryDate);

  const handleApply = () => {
    if (!medicineName.trim()) return alert("कृपया दवाई का नाम दर्ज करें!");
    if (!batchNumber.trim()) return alert("कृपया बैच नंबर दर्ज करें!");
    if (!expiryDate.trim()) return alert("कृपया एक्सपायरी डेट (MM/YY) दर्ज करें!");
    if (!stripRate) return alert("कृपया रेट दर्ज करें!");

    const finalItem = {
      name: `${medicineName.trim()} (Batch: ${batchNumber.trim()} | Exp: ${expiryDate.trim()})`,
      category: "Pharmacy",
      batchNumber: batchNumber.trim(),
      mfgDate: mfgDate.trim(),
      expiryDate: expiryDate.trim(),
      quantity: parseFloat(quantity) || 1,
      unit: packType === "strip" ? "STRIP" : "TAB",
      rate: calculatedRate,
      mrp: parseFloat(mrp) || parseFloat(stripRate) || 0,
      total: totalAmount,
      isScheduleH,
      doctorName: isScheduleH ? doctorName.trim() : undefined,
      patientName: isScheduleH ? patientName.trim() : undefined,
      notes: isScheduleH ? `Schedule-H Rx by Dr. ${doctorName}` : ""
    };

    onApplyItem(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/30 rounded-xl border border-teal-400/30">
              <Pill className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>दवा दुकान व फार्मेसी बिलिंग सूट</span>
                <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-bold">Batch & Expiry</span>
              </h2>
              <p className="text-xs text-teal-200 font-medium">
                बैच नंबर, एक्सपायरी डेट, स्ट्रिप-टू-गोली कन्वर्जन व शिड्यूल-H ट्रैकिंग
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">दवाई का नाम (Medicine Name) *</label>
            <input
              type="text"
              list="pharma-med-list"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Augmentin 625 Duo Tablet, Dolo 650"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold"
            />
            <datalist id="pharma-med-list">
              {inventory.map((p) => (
                <option key={p._id || p.id} value={p.name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">बैच नंबर (Batch No) *</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                placeholder="e.g. B8042"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold uppercase bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mfg Date (MM/YY)</label>
              <input
                type="text"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                placeholder="02/25"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (MM/YY) *</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="12/26"
                className={`w-full px-3 py-2 text-xs rounded-xl border font-bold bg-white ${
                  isNearExpiry ? "border-red-500 text-red-700 bg-red-50" : "border-slate-300"
                }`}
              />
            </div>
          </div>

          {isNearExpiry && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-xs flex items-center gap-2 font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>⚠️ चेतावनी: यह बैच अगले 3 महीने के भीतर एक्सपायर हो रहा है!</span>
            </div>
          )}

          {/* Strip vs Loose Tablet */}
          <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-900">बिक्री का प्रकार (Packaging)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPackType("strip")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    packType === "strip" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-700 border"
                  }`}
                >
                  पूरी पत्ती (Full Strip)
                </button>
                <button
                  type="button"
                  onClick={() => setPackType("loose_tablet")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    packType === "loose_tablet" ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-700 border"
                  }`}
                >
                  खुली गोली (Loose Tablets)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">स्ट्रिप रेट (₹ Strip)</label>
                <input
                  type="number"
                  value={stripRate}
                  onChange={(e) => setStripRate(e.target.value)}
                  placeholder="₹ 120"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">गोली प्रति पत्ती</label>
                <input
                  type="number"
                  value={tabletsPerStrip}
                  onChange={(e) => setTabletsPerStrip(e.target.value)}
                  placeholder="10"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">मात्रा ({packType === "strip" ? "Strips" : "Tabs"})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="₹ MRP"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>
            </div>
          </div>

          {/* Schedule H Rx Warning */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sch-h"
                checked={isScheduleH}
                onChange={(e) => setIsScheduleH(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <label htmlFor="sch-h" className="text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Schedule-H / H1 Prescribed Medicine (डॉक्टर पर्चा जरूरी)</span>
              </label>
            </div>

            {isScheduleH && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Doctor Name (e.g. Dr. R.K. Sharma)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                />
                <input
                  type="text"
                  placeholder="Patient Name (e.g. Ramesh Kumar)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-teal-400 font-bold">
                {quantity} {packType === "strip" ? "Strips" : "Tablets"} @ ₹{calculatedRate.toFixed(2)}
              </div>
              <div className="text-sm font-black">
                कुल रकम: <span className="text-amber-400 font-mono text-base">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>बिल में जोड़ें (+ Add Medicine)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
