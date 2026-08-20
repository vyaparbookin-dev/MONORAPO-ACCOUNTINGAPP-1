import React, { useState } from "react";
import { X, Zap, Cpu, CheckCircle, Calculator, ShieldAlert, Sparkles, Box } from "lucide-react";

export default function ElectricalWireModal({ isOpen, onClose, onApplyWireItem, inventory = [] }) {
  const [wireName, setWireName] = useState("Havells Life Line Plus FR Cable");
  const [wireGauge, setWireGauge] = useState("2.5 sq mm");
  const [wireColor, setWireColor] = useState("Red");
  const [sellingMode, setSellingMode] = useState("meter"); // 'coil' or 'meter'
  const [coilLength, setCoilLength] = useState(90); // 90 meters per coil
  const [coilRate, setCoilRate] = useState(2450); // Rate per full coil
  const [quantity, setQuantity] = useState(15); // Quantity in meters or coils
  
  // LED / Appliance Replacement Warranty Stamping
  const [isBulbReplacement, setIsBulbReplacement] = useState(false);
  const [bulbWattage, setBulbWattage] = useState("9W");
  const [replacementWarrantyYears, setReplacementWarrantyYears] = useState("2");
  const [stampDate, setStampDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  // Rate calculations
  const perMeterRate = Math.round((parseFloat(coilRate) / parseFloat(coilLength)) * 1.15 * 10) / 10; // 15% loose cut margin
  const appliedRate = sellingMode === "coil" ? parseFloat(coilRate) || 0 : perMeterRate;
  const totalAmount = Math.round((parseFloat(quantity) || 1) * appliedRate * 100) / 100;

  const handleApply = () => {
    if (!wireName.trim()) return alert("कृपया तार या इलेक्ट्रिकल आइटम का नाम दर्ज करें!");

    const finalItem = {
      name: isBulbReplacement
        ? `${wireName.trim()} (${bulbWattage} - ${replacementWarrantyYears} Yr Replacement Warranty - Stamped: ${stampDate})`
        : `${wireName.trim()} (${wireGauge} - ${wireColor}) - ${sellingMode === 'coil' ? 'Full Coil' : 'Cut Meter'}`,
      category: "Electricals & Wiring",
      quantity: parseFloat(quantity) || 1,
      rate: appliedRate,
      unit: sellingMode === "coil" ? "COIL" : "MTR",
      total: totalAmount,
      notes: isBulbReplacement
        ? `Wattage: ${bulbWattage} | Warranty: ${replacementWarrantyYears} Years | Stamp Date: ${stampDate}`
        : `Gauge: ${wireGauge} | Color: ${wireColor} | Mode: ${sellingMode} (${coilLength}m coil base @ ₹${coilRate})`,
    };

    onApplyWireItem(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-yellow-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/30 rounded-xl border border-yellow-400/30">
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>इलेक्ट्रिकल तार कॉइल-टू-मीटर एवं LED वारंटी कैलकुलेटर</span>
                <span className="text-[10px] bg-yellow-500 text-slate-900 px-2 py-0.5 rounded-full font-black">Coil & Warranty</span>
              </h2>
              <p className="text-xs text-yellow-200 font-medium">
                बंडल (Coil) से खुला मीटर काटना, गेज व LED बल्ब 2-साल रिप्लेसमेंट स्टैम्पिंग
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Mode Switcher: Wire Coil vs LED Bulb Replacement */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setIsBulbReplacement(false)}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                !isBulbReplacement ? "bg-amber-600 text-white shadow" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              ⚡ तार / केबल बंडल व खुला मीटर (Wire Coil / Loose Meter)
            </button>
            <button
              type="button"
              onClick={() => setIsBulbReplacement(true)}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition ${
                isBulbReplacement ? "bg-amber-600 text-white shadow" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              💡 LED बल्ब व उपकरण रिप्लेसमेंट वारंटी (Warranty Stamping)
            </button>
          </div>

          {!isBulbReplacement ? (
            /* Wire & Cable Calculator */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">तार / केबल का नाम *</label>
                  <input
                    type="text"
                    value={wireName}
                    onChange={(e) => setWireName(e.target.value)}
                    placeholder="e.g. Havells Life Line Plus, Polycab Green Wire"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">तार गेज (Thickness)</label>
                  <select
                    value={wireGauge}
                    onChange={(e) => setWireGauge(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="0.75 sq mm">0.75 sq mm (CCTV / Low Current)</option>
                    <option value="1.0 sq mm">1.0 sq mm (Lighting)</option>
                    <option value="1.5 sq mm">1.5 sq mm (Fans & Sockets)</option>
                    <option value="2.5 sq mm">2.5 sq mm (Power Socket / Geyser)</option>
                    <option value="4.0 sq mm">4.0 sq mm (AC 1.5 Ton / Kitchen)</option>
                    <option value="6.0 sq mm">6.0 sq mm (Main Line / Sub-panel)</option>
                    <option value="10.0 sq mm">10.0 sq mm (Main Heavy Line)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रंग (Wire Color)</label>
                  <select
                    value={wireColor}
                    onChange={(e) => setWireColor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Red">लाल (Red)</option>
                    <option value="Black">काला (Black)</option>
                    <option value="Green">हरा (Green)</option>
                    <option value="Blue">नीला (Blue)</option>
                    <option value="Yellow">पीला (Yellow)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बंडल में कुल मीटर (Coil Length)</label>
                  <input
                    type="number"
                    value={coilLength}
                    onChange={(e) => setCoilLength(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पूरे बंडल का रेट (Coil Price ₹)</label>
                  <input
                    type="number"
                    value={coilRate}
                    onChange={(e) => setCoilRate(e.target.value)}
                    placeholder="2450"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-amber-800"
                  />
                </div>
              </div>

              {/* Selling Mode Switch */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    बिक्री का तरीका (Selling Mode)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSellingMode("meter")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        sellingMode === "meter" ? "bg-amber-600 text-white shadow" : "bg-white text-slate-700 border"
                      }`}
                    >
                      ✂️ खुला मीटर काटें
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellingMode("coil")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        sellingMode === "coil" ? "bg-amber-600 text-white shadow" : "bg-white text-slate-700 border"
                      }`}
                    >
                      📦 पूरा बंडल (Coil)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      बेची जाने वाली मात्रा ({sellingMode === "coil" ? "Coil" : "Meter"}) *
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 font-black text-amber-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      लागू दर (₹ / {sellingMode === "coil" ? "Coil" : "Meter"})
                    </label>
                    <div className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-black text-slate-900 bg-slate-100 font-mono">
                      ₹{appliedRate}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">कुल रकम (Total ₹)</label>
                    <div className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 font-black text-amber-950 bg-amber-100 font-mono">
                      ₹{totalAmount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* LED Bulb Replacement Warranty Stamping */
            <div className="bg-yellow-50/70 p-4 rounded-xl border border-yellow-200 space-y-3">
              <label className="text-xs font-black text-yellow-950 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                <span>LED बल्ब / उपकरण रिप्लेसमेंट वारंटी स्टैम्पिंग</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बल्ब नाम / ब्रांड</label>
                  <input
                    type="text"
                    value={wireName}
                    onChange={(e) => setWireName(e.target.value)}
                    placeholder="e.g. Philips LED Bulb, Crompton 9W"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">वाट क्षमता (Wattage)</label>
                  <select
                    value={bulbWattage}
                    onChange={(e) => setBulbWattage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="9W">9 Watt (Standard)</option>
                    <option value="12W">12 Watt (Bright)</option>
                    <option value="15W">15 Watt</option>
                    <option value="20W">20 Watt (Tube / Heavy)</option>
                    <option value="50W">50 Watt (Floodlight)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रिप्लेसमेंट वारंटी</label>
                  <select
                    value={replacementWarrantyYears}
                    onChange={(e) => setReplacementWarrantyYears(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="1">1 वर्ष गारंटी</option>
                    <option value="2">2 वर्ष गारंटी (2-Year Replacement)</option>
                    <option value="3">3 वर्ष गारंटी</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बल्ब पर स्टैम्प की गई तारीख</label>
                  <input
                    type="date"
                    value={stampDate}
                    onChange={(e) => setStampDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">मात्रा (PCS)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रेट प्रति पीस (₹)</label>
                  <input
                    type="number"
                    value={coilRate}
                    onChange={(e) => setCoilRate(e.target.value)}
                    placeholder="110"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white font-mono text-amber-800"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 text-right">
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl font-black text-xs shadow-lg transition"
            >
              ⚡ बिल में जोड़ें (+ Add to Invoice)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
