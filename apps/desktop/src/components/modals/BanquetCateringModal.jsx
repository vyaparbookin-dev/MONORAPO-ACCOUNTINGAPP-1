import React, { useState } from "react";
import { X, Calendar, Users, DollarSign, Plus, CheckCircle, Gift, Sparkles, Building } from "lucide-react";

export default function BanquetCateringModal({ isOpen, onClose, onApplyBanquet }) {
  const [eventName, setEventName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [hallZone, setHallZone] = useState("Main Banquet Hall (AC)");
  const [totalPax, setTotalPax] = useState(250); // Total Guests
  const [ratePerPlate, setRatePerPlate] = useState(550); // Per plate rate
  const [hallRent, setHallRent] = useState(25000); // Hall Rent
  const [decorationCharges, setDecorationCharges] = useState(15000);
  const [djMusicCharges, setDjMusicCharges] = useState(8000);
  const [advanceToken, setAdvanceToken] = useState(20000);
  const [menuNotes, setMenuNotes] = useState("Welcome Drink, 3 Starters, 2 Paneer Sabzi, Dal Makhani, 4 Breads, Gulab Jamun & Ice Cream");

  if (!isOpen) return null;

  const totalFoodAmount = (parseInt(totalPax) || 0) * (parseFloat(ratePerPlate) || 0);
  const totalExtraCharges =
    (parseFloat(hallRent) || 0) +
    (parseFloat(decorationCharges) || 0) +
    (parseFloat(djMusicCharges) || 0);

  const grandTotal = totalFoodAmount + totalExtraCharges;
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
      notes: `Event Date: ${eventDate} | Hall: ${hallZone} | Hall Rent: ₹${hallRent} | Decor: ₹${decorationCharges} | DJ: ₹${djMusicCharges} | Advance Paid: ₹${advanceToken} | Balance: ₹${balancePending} | Menu: ${menuNotes}`
    };

    onApplyBanquet(banquetItem, {
      hallRent,
      decorationCharges,
      djMusicCharges,
      advanceToken,
      grandTotal,
      balancePending
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
                <span>बैंक्वेट हॉल व कैटरिंग प्रति प्लेट बुकिंग सिस्टम</span>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">Banquet & Catering</span>
              </h2>
              <p className="text-xs text-rose-200 font-medium">
                मेहमानों की संख्या (Pax), प्रति प्लेट रेट, हॉल किराया, डेकोरेशन व एडवांस टोकन
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
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
                  placeholder="250"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-black text-rose-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">रेट प्रति प्लेट (₹ / Plate) *</label>
                <input
                  type="number"
                  value={ratePerPlate}
                  onChange={(e) => setRatePerPlate(e.target.value)}
                  placeholder="550"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-black text-rose-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">कुल कैटरिंग रकम (Food Amount)</label>
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

          {/* Grand Total Summary */}
          <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-xl">
            <div className="border-r border-slate-700 pr-2">
              <p className="text-[11px] text-slate-400 font-medium">कुल बुकिंग बजट (Grand Total)</p>
              <p className="text-lg font-black text-rose-400 font-mono">₹{grandTotal.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">खाना: ₹{totalFoodAmount} + हॉल/एक्स्ट्रा: ₹{totalExtraCharges}</p>
            </div>

            <div className="border-r border-slate-700 pr-2">
              <p className="text-[11px] text-slate-400 font-medium">एडवांस टोकन (Advance Paid)</p>
              <p className="text-lg font-black text-emerald-400 font-mono">₹{(parseFloat(advanceToken) || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">रसीद में कटेगा</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 font-medium">बाकी रकम (Balance Due)</p>
              <p className="text-lg font-black text-amber-400 font-mono">₹{balancePending.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">इवेंट के दिन देय</p>
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
