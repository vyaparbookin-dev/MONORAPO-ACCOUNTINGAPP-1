import React, { useState } from "react";
import { X, Calendar, Users, DollarSign, Plus, CheckCircle, Gift, Sparkles, Building, Percent, Calculator } from "lucide-react";

export default function BanquetCateringModal({ isOpen, onClose, onApplyBanquet }) {
  const [eventName, setEventName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [hallZone, setHallZone] = useState("Main Banquet Hall (AC)");
  const [totalPax, setTotalPax] = useState(100); // Total Guests
  const [ratePerPlate, setRatePerPlate] = useState(700); // Per plate rate
  const [hallRent, setHallRent] = useState(25000); // Hall Rent
  const [decorationCharges, setDecorationCharges] = useState(15000);
  const [djMusicCharges, setDjMusicCharges] = useState(8000);
  const [advanceToken, setAdvanceToken] = useState(20000);
  
  // GST Mode: 'itemized' (5% on Food, 18% on Hall/Decor/DJ), 'composite_5' (Flat 5%), 'composite_18' (Flat 18%), 'none' (0%)
  const [gstMode, setGstMode] = useState("itemized");
  const [foodGstRate, setFoodGstRate] = useState(5); // 5% for Food / Catering
  const [servicesGstRate, setServicesGstRate] = useState(18); // 18% for Hall, Decor, DJ

  const [menuNotes, setMenuNotes] = useState("Welcome Drink, 3 Starters, 2 Paneer Sabzi, Dal Makhani, 4 Breads, Gulab Jamun & Ice Cream");

  if (!isOpen) return null;

  const totalFoodAmount = (parseInt(totalPax) || 0) * (parseFloat(ratePerPlate) || 0);
  const totalExtraCharges =
    (parseFloat(hallRent) || 0) +
    (parseFloat(decorationCharges) || 0) +
    (parseFloat(djMusicCharges) || 0);

  const baseAmount = totalFoodAmount + totalExtraCharges;

  // Calculate GST
  let foodGst = 0;
  let servicesGst = 0;
  let totalGst = 0;

  if (gstMode === "itemized") {
    foodGst = Math.round((totalFoodAmount * foodGstRate) / 100);
    servicesGst = Math.round((totalExtraCharges * servicesGstRate) / 100);
    totalGst = foodGst + servicesGst;
  } else if (gstMode === "composite_5") {
    totalGst = Math.round((baseAmount * 5) / 100);
  } else if (gstMode === "composite_18") {
    totalGst = Math.round((baseAmount * 18) / 100);
  } else {
    totalGst = 0;
  }

  const grandTotal = baseAmount + totalGst;
  const balancePending = grandTotal - (parseFloat(advanceToken) || 0);

  const handleApplyToBill = () => {
    if (!eventName.trim()) return alert("कृपया इवेंट का नाम (e.g. Wedding / Birthday) दर्ज करें!");
    if (!customerName.trim()) return alert("कृपया कस्टमर का नाम दर्ज करें!");
    if (!totalPax || totalPax <= 0) return alert("कृपया मेहमानों की संख्या (Pax) दर्ज करें!");

    const banquetItem = {
      name: `${eventName.trim()} Banquet Catering (${totalPax} Guests @ ₹${ratePerPlate}/Plate) - ${customerName.trim()}`,
      category: "Banquet & Catering",
      quantity: parseInt(totalPax) || 1,
      rate: parseFloat(ratePerPlate) || 0,
      unit: "PLATE",
      total: totalFoodAmount,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      tax: totalGst,
      notes: `Event Date: ${eventDate} | Hall: ${hallZone} | Food: ₹${totalFoodAmount} (GST ${gstMode === 'itemized' ? '5%' : gstMode}) | Hall Rent: ₹${hallRent} | Decor: ₹${decorationCharges} | DJ: ₹${djMusicCharges} | Total GST: ₹${totalGst} | Advance Paid: ₹${advanceToken} | Balance: ₹${balancePending} | Menu: ${menuNotes}`
    };

    onApplyBanquet(banquetItem, {
      hallRent,
      decorationCharges,
      djMusicCharges,
      totalGst,
      advanceToken,
      grandTotal,
      balancePending,
      gstMode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/30 rounded-xl border border-rose-400/30">
              <Building className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>बैंक्वेट हॉल व कैटरिंग प्रति प्लेट बुकिंग एवं GST सिस्टम</span>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">Banquet & Catering</span>
              </h2>
              <p className="text-xs text-rose-200 font-medium">
                मेहमान (Pax) × प्रति प्लेट रेट + हॉल किराया + डेकोरेशन + अलग-अलग GST गणना
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Event & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">इवेंट का नाम (Event Name) *</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Sharma Wedding Reception, Birthday Party"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">कस्टमर / पार्टी का नाम *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Mr. Anil Sharma"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
              <input
                type="text"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          {/* Per Plate Food Costing Grid */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-3">
            <label className="text-xs font-black text-rose-950 uppercase tracking-wide block">
              1. प्रति प्लेट कैटरिंग गणना (Pax × Per Plate Rate)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">मेहमानों की संख्या (Total Pax) *</label>
                <input
                  type="number"
                  value={totalPax}
                  onChange={(e) => setTotalPax(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-black text-rose-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">रेट प्रति प्लेट (₹ / Plate) *</label>
                <input
                  type="number"
                  value={ratePerPlate}
                  onChange={(e) => setRatePerPlate(e.target.value)}
                  placeholder="700"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-black text-rose-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">कुल खाना रकम (Food Amount)</label>
                <div className="w-full px-3 py-2 text-sm rounded-xl border border-rose-200 font-black text-rose-900 bg-rose-100 font-mono">
                  ₹{totalFoodAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Menu Items Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">तय किया गया मेनू (Menu Items)</label>
              <textarea
                rows={2}
                value={menuNotes}
                onChange={(e) => setMenuNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700"
              />
            </div>
          </div>

          {/* Hall & Extra Services */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
              2. हॉल व अन्य सेवाएं (Hall Rent & Extra Services)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">हॉल किराया (Hall Rent ₹)</label>
                <input
                  type="number"
                  value={hallRent}
                  onChange={(e) => setHallRent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">डेकोरेशन (₹)</label>
                <input
                  type="number"
                  value={decorationCharges}
                  onChange={(e) => setDecorationCharges(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">DJ / साउंड (₹)</label>
                <input
                  type="number"
                  value={djMusicCharges}
                  onChange={(e) => setDjMusicCharges(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">एडवांस टोकन जमा (₹)</label>
                <input
                  type="number"
                  value={advanceToken}
                  onChange={(e) => setAdvanceToken(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold text-emerald-700 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. GST Calculation Settings */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <Percent size={14} className="text-amber-700" />
                <span>3. GST गणना का प्रकार (GST Calculation Mode)</span>
              </label>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setGstMode("itemized")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    gstMode === "itemized" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-slate-700 border"
                  }`}
                >
                  अलग-अलग दर (5% खाना + 18% हॉल/सजावट)
                </button>
                <button
                  type="button"
                  onClick={() => setGstMode("composite_5")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    gstMode === "composite_5" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-slate-700 border"
                  }`}
                >
                  फ्लैट 5% पैकेज
                </button>
                <button
                  type="button"
                  onClick={() => setGstMode("composite_18")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    gstMode === "composite_18" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-slate-700 border"
                  }`}
                >
                  फ्लैट 18% पैकेज
                </button>
                <button
                  type="button"
                  onClick={() => setGstMode("none")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    gstMode === "none" ? "bg-amber-600 text-white shadow-sm" : "bg-white text-slate-700 border"
                  }`}
                >
                  बिना GST (0%)
                </button>
              </div>
            </div>

            {/* GST Breakdown Table */}
            {gstMode !== "none" && (
              <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1.5">
                {gstMode === "itemized" ? (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>• खाना कैटरिंग (₹{totalFoodAmount.toLocaleString()}) पर 5% GST:</span>
                      <span className="font-bold font-mono">₹{foodGst.toLocaleString()} (CGST: ₹{(foodGst/2).toFixed(0)} + SGST: ₹{(foodGst/2).toFixed(0)})</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>• हॉल किराया, डेकोरेशन व DJ (₹{totalExtraCharges.toLocaleString()}) पर 18% GST:</span>
                      <span className="font-bold font-mono">₹{servicesGst.toLocaleString()} (CGST: ₹{(servicesGst/2).toFixed(0)} + SGST: ₹{(servicesGst/2).toFixed(0)})</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-700">
                    <span>• कुल पैकेज (₹{baseAmount.toLocaleString()}) पर {gstMode === 'composite_5' ? '5%' : '18%'} GST:</span>
                    <span className="font-bold font-mono">₹{totalGst.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-900 font-bold border-t pt-1">
                  <span>कुल GST टैक्स:</span>
                  <span className="font-mono">₹{totalGst.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Grand Total Summary */}
          <div className="grid grid-cols-4 gap-2 bg-slate-900 text-white p-4 rounded-xl">
            <div className="border-r border-slate-700 pr-2">
              <p className="text-[10px] text-slate-400 font-medium">मूल राशि (Base)</p>
              <p className="text-base font-black text-white font-mono">₹{baseAmount.toLocaleString()}</p>
              <p className="text-[9px] text-slate-500">खाना + हॉल + DJ</p>
            </div>

            <div className="border-r border-slate-700 pr-2">
              <p className="text-[10px] text-slate-400 font-medium">कुल GST</p>
              <p className="text-base font-black text-amber-400 font-mono">₹{totalGst.toLocaleString()}</p>
              <p className="text-[9px] text-slate-500">{gstMode === 'itemized' ? '5% + 18%' : gstMode}</p>
            </div>

            <div className="border-r border-slate-700 pr-2">
              <p className="text-[10px] text-slate-400 font-medium">कुल बिल (Total)</p>
              <p className="text-base font-black text-rose-400 font-mono">₹{grandTotal.toLocaleString()}</p>
              <p className="text-[9px] text-slate-500">टैक्स सहित</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-medium">बाकी देय (Due)</p>
              <p className="text-base font-black text-emerald-400 font-mono">₹{balancePending.toLocaleString()}</p>
              <p className="text-[9px] text-slate-500">टोकन कटकर</p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleApplyToBill}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl font-black text-xs shadow-lg transition"
            >
              🧾 बैंक्वेट कोटेशन / बिल बनाएं (+ Add to Invoice)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
