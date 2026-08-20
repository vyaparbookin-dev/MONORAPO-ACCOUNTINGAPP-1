import React, { useState } from "react";
import { X, Smartphone, ShieldCheck, CreditCard, QrCode, Plus, CheckCircle, Tag, Tv, Zap, Cpu } from "lucide-react";

export default function ElectronicsImeiModal({ isOpen, onClose, onApplyImeiItem, inventory = [] }) {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("Samsung");
  const [modelVariant, setModelVariant] = useState("8GB / 128GB - Phantom Black");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("12");
  
  // Finance / EMI Details
  const [isEmiFinance, setIsEmiFinance] = useState(false);
  const [financeCompany, setFinanceCompany] = useState("Bajaj Finserv");
  const [emiRefNumber, setEmiRefNumber] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [emiTenureMonths, setEmiTenureMonths] = useState("6");

  // Appliance / Installation
  const [needsInstallation, setNeedsInstallation] = useState(false);
  const [installationDate, setInstallationDate] = useState("");
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [installationChargeType, setInstallationChargeType] = useState("free"); // "free", "paid", "company"
  const [installationFee, setInstallationFee] = useState(0);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!productName.trim()) return alert("कृपया मोबाइल / इलेक्ट्रॉनिक्स आइटम का नाम दर्ज करें!");
    if (!imei1.trim() && !serialNumber.trim()) {
      return alert("कृपया कम से कम 1 IMEI नंबर या सीरियल नंबर दर्ज करें!");
    }

    const price = parseFloat(sellingPrice) || 0;
    const finalItem = {
      name: `${productName.trim()} (${brand} ${modelVariant})`,
      category: "Electronics & Mobile",
      quantity: 1,
      rate: price,
      unit: "PCS",
      total: price,
      imei1: imei1.trim(),
      imei2: imei2.trim(),
      serialNumber: serialNumber.trim(),
      warrantyMonths: parseInt(warrantyMonths) || 12,
      isEmiFinance,
      financeDetails: isEmiFinance
        ? {
            provider: financeCompany,
            refNumber: emeiRefNumber || emiRefNumber,
            downPayment: parseFloat(downPayment) || 0,
            tenure: emiTenureMonths,
          }
        : null,
      installationDetails: needsInstallation
        ? {
            date: installationDate,
            notes: technicianNotes,
          }
        : null,
      notes: `IMEI 1: ${imei1.trim()} ${imei2 ? '| IMEI 2: ' + imei2.trim() : ''} ${serialNumber ? '| SN: ' + serialNumber.trim() : ''} | Warranty: ${warrantyMonths} Months ${isEmiFinance ? '| Finance: ' + financeCompany + ' (Ref: ' + emiRefNumber + ')' : ''} ${needsInstallation ? '| Install on: ' + installationDate : ''}`,
    };

    onApplyImeiItem(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/30 rounded-xl border border-blue-400/30">
              <Smartphone className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>मोबाइल व इलेक्ट्रॉनिक्स IMEI / सीरियल नंबर ट्रैकर</span>
                <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">IMEI & Warranty</span>
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Dual IMEI, वारंटी पीरियड, बजाज/HDFC EMI फाइनेंस व इंस्टॉलेशन ट्रैकर
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Product & Variant */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">मॉडल / प्रोडक्ट नाम *</label>
              <input
                type="text"
                list="electronics-prod-list"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  const matched = inventory.find((p) => p.name.toLowerCase() === e.target.value.toLowerCase());
                  if (matched) {
                    setSellingPrice(matched.sellingPrice || matched.price || "");
                    if (matched.brand) setBrand(matched.brand);
                  }
                }}
                placeholder="e.g. Galaxy S24, iPhone 15, LG 1.5T AC"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
              <datalist id="electronics-prod-list">
                {inventory.map((p) => (
                  <option key={p._id || p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ब्रांड (Brand)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Samsung, Apple, Realme, LG"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">वेरिएंट / कलर / स्टोरेज (RAM/ROM)</label>
              <input
                type="text"
                value={modelVariant}
                onChange={(e) => setModelVariant(e.target.value)}
                placeholder="e.g. 8GB/256GB - Blue, 5-Star Dual Inverter"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">बिक्री दर (Selling Price ₹) *</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 34999"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-black text-blue-700 font-mono"
              />
            </div>
          </div>

          {/* Dual IMEI & Serial Number Section */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
            <label className="text-xs font-black text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
              <QrCode size={14} className="text-blue-600" />
              <span>1. IMEI एवं सीरियल नंबर (बारकोड स्कैनर से स्कैन करें)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IMEI 1 (15 अंक) *</label>
                <input
                  type="text"
                  maxLength={15}
                  value={imei1}
                  onChange={(e) => setImei1(e.target.value.replace(/\D/g, ""))}
                  placeholder="358941098765432"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 font-mono font-bold bg-white text-blue-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IMEI 2 (वैकल्पिक)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value.replace(/\D/g, ""))}
                  placeholder="358941098765433"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold bg-white text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">सीरियल नंबर (Serial / S/N)</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  placeholder="R58M30XYZ123"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold bg-white uppercase text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-600" /> वारंटी अवधि (महीने)
                </label>
                <select
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-700"
                >
                  <option value="6">6 महीने (Refurbished / Second Hand)</option>
                  <option value="12">1 वर्ष (Standard Brand Warranty)</option>
                  <option value="24">2 वर्ष (Extended Warranty)</option>
                  <option value="36">3 वर्ष (Appliance / Panel)</option>
                  <option value="60">5 वर्ष (Compressor / Motor)</option>
                  <option value="120">10 वर्ष (Inverter Compressor)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. EMI / Finance Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard size={14} className="text-purple-600" />
                <span>2. EMI / फाइनेंस सुविधा (Finance Loan)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-purple-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmiFinance}
                  onChange={(e) => setIsEmiFinance(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>EMI पर बेचा गया?</span>
              </label>
            </div>

            {isEmiFinance && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">फाइनेंस कंपनी</label>
                  <select
                    value={financeCompany}
                    onChange={(e) => setFinanceCompany(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                  >
                    <option value="Bajaj Finserv">Bajaj Finserv</option>
                    <option value="HDFC Bank EMI">HDFC Bank EMI</option>
                    <option value="TVS Credit">TVS Credit</option>
                    <option value="IDFC First Bank">IDFC First Bank</option>
                    <option value="Home Credit">Home Credit</option>
                    <option value="Credit Card EMI">Credit Card EMI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">लोन / D.O. रेफरेंस नंबर</label>
                  <input
                    type="text"
                    value={emiRefNumber}
                    onChange={(e) => setEmiRefNumber(e.target.value)}
                    placeholder="DO-98765432"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">डाउन पेमेंट जमा (₹)</label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="5000"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">किस्त अवधि (महीने)</label>
                  <select
                    value={emiTenureMonths}
                    onChange={(e) => setEmiTenureMonths(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                  >
                    <option value="3">3 महीने</option>
                    <option value="6">6 महीने (0% Interest)</option>
                    <option value="8">8 महीने</option>
                    <option value="10">10 महीने</option>
                    <option value="12">12 महीने</option>
                    <option value="24">24 महीने</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 3. Installation & Demo (for AC, TV, Fridge) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tv size={14} className="text-indigo-600" />
                <span>होम अप्लायंस इंस्टॉलेशन / टेक्नीशियन विजिट</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-indigo-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsInstallation}
                  onChange={(e) => setNeedsInstallation(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <span>इंस्टॉलेशन शेड्यूल करें</span>
              </label>
            </div>

            {needsInstallation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="टेक्नीशियन निर्देश (e.g. 3rd Floor, Wall Mount)"
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            )}
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-lg transition"
            >
              📱 IMEI व वारंटी सहित बिल में जोड़ें (+ Add to Invoice)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
