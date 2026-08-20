import React, { useState } from "react";
import { X, Wrench, Car, Gauge, Fuel, Plus, Trash2, CheckCircle, ShieldCheck } from "lucide-react";

export default function AutomobileJobCardModal({ isOpen, onClose, onApplyJobCard, inventory = [] }) {
  const [vehicleNumber, setVehicleNumber] = useState("DL 01 AB 1234");
  const [vehicleModel, setVehicleModel] = useState("Honda Activa 6G");
  const [kmReading, setKmReading] = useState("14250");
  const [fuelLevel, setFuelLevel] = useState("50%");
  const [mechanicName, setMechanicName] = useState("Suresh Head Mechanic");
  const [laborCharges, setLaborCharges] = useState(350);
  const [washingCharges, setWashingCharges] = useState(150);
  const [complaintNotes, setComplaintNotes] = useState("General Service, Engine Oil Change, Front Brake Tightening");

  if (!isOpen) return null;

  const totalServiceCharges = (parseFloat(laborCharges) || 0) + (parseFloat(washingCharges) || 0);

  const handleApply = () => {
    if (!vehicleNumber.trim()) return alert("कृपया गाड़ी नंबर दर्ज करें!");

    const finalItem = {
      name: `Vehicle Service: ${vehicleModel} (${vehicleNumber.trim().toUpperCase()}) - KM: ${kmReading}`,
      category: "Automobile & Garage Services",
      quantity: 1,
      rate: totalServiceCharges,
      unit: "JOB",
      total: totalServiceCharges,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleModel,
      kmReading,
      mechanicName,
      laborCharges,
      washingCharges,
      notes: `Vehicle: ${vehicleNumber.trim().toUpperCase()} (${vehicleModel}) | KM: ${kmReading} | Fuel: ${fuelLevel} | Mechanic: ${mechanicName} | Labor: ₹${laborCharges} | Washing: ₹${washingCharges} | Job Notes: ${complaintNotes}`,
    };

    onApplyJobCard(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-neutral-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-xl border border-amber-400/30">
              <Car className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>गैराज / ऑटोमोबाइल सर्विस जॉब कार्ड</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">Job Card</span>
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                गाड़ी नंबर, किलोमीटर रीडिंग, लेबर व वाशिंग चार्ज और मैकेनिक असाइनमेंट
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">गाड़ी नंबर (Vehicle No) *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DL 01 AB 1234, RJ 14 XY 5678"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-black uppercase text-amber-900 bg-amber-50/40 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">गाड़ी मॉडल (Make & Model)</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Honda Activa 6G, Maruti Swift VXi"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge size={13} className="text-blue-600" /> वर्तमान KM रीडिंग
              </label>
              <input
                type="number"
                value={kmReading}
                onChange={(e) => setKmReading(e.target.value)}
                placeholder="14250"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Fuel size={13} className="text-orange-600" /> फ्यूल लेवल (Fuel)
              </label>
              <select
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="Reserve / E">Reserve / Empty</option>
                <option value="25%">25% (1/4 Tank)</option>
                <option value="50%">50% (Half Tank)</option>
                <option value="75%">75% (3/4 Tank)</option>
                <option value="100% Full">100% Full Tank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">असाइन मैकेनिक (Mechanic)</label>
              <input
                type="text"
                value={mechanicName}
                onChange={(e) => setMechanicName(e.target.value)}
                placeholder="e.g. Suresh Mechanic"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          {/* Charges Grid */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
              सर्विस व लेबर चार्ज (Service & Labor Charges)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">मैकेनिक लेबर चार्ज (₹)</label>
                <input
                  type="number"
                  value={laborCharges}
                  onChange={(e) => setLaborCharges(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">वाशिंग व पॉलिशिंग चार्ज (₹)</label>
                <input
                  type="number"
                  value={washingCharges}
                  onChange={(e) => setWashingCharges(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">कुल सर्विस चार्ज (₹)</label>
                <div className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 font-black text-amber-950 bg-amber-100 font-mono">
                  ₹{totalServiceCharges}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">काम का विवरण / शिकायत (Work Notes)</label>
              <textarea
                rows={2}
                value={complaintNotes}
                onChange={(e) => setComplaintNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-black text-xs shadow-lg transition"
            >
              🚗 जॉब कार्ड बिल में जोड़ें (+ Add to Invoice)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
