import React, { useState } from "react";
import { X, Scissors, Sparkles, UserCheck, DollarSign, Clock, Plus, Trash2, CheckCircle } from "lucide-react";

export default function SalonSpaModal({ isOpen, onClose, onApplySalonService, inventory = [] }) {
  const [serviceName, setServiceName] = useState("Hair Cut & Beard Styling");
  const [customerGender, setCustomerGender] = useState("Men");
  const [stylistName, setStylistName] = useState("Raju Senior Stylist");
  const [servicePrice, setServicePrice] = useState(350);
  const [commissionType, setCommissionType] = useState("percentage"); // 'percentage' or 'fixed'
  const [commissionValue, setCommissionValue] = useState(20); // 20% or ₹50
  
  // Consumable Products used (Shampoo, Hair Wax, Facial Kit)
  const [consumables, setConsumables] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQty, setProductQty] = useState(1);

  if (!isOpen) return null;

  const commissionAmount =
    commissionType === "percentage"
      ? Math.round(((parseFloat(servicePrice) || 0) * (parseFloat(commissionValue) || 0)) / 100)
      : parseFloat(commissionValue) || 0;

  const handleAddConsumable = () => {
    if (!selectedProduct.trim()) return alert("कृपया इस्तेमाल किए गए प्रोडक्ट का नाम चुनें!");
    setConsumables([...consumables, { id: Date.now(), name: selectedProduct, quantity: productQty }]);
    setSelectedProduct("");
    setProductQty(1);
  };

  const handleApply = () => {
    if (!serviceName.trim()) return alert("कृपया सर्विस का नाम दर्ज करें!");

    const finalItem = {
      name: `${serviceName.trim()} (${customerGender}) - Stylist: ${stylistName.trim()}`,
      category: "Salon & Spa Services",
      quantity: 1,
      rate: parseFloat(servicePrice) || 0,
      unit: "SRV",
      total: parseFloat(servicePrice) || 0,
      stylistName: stylistName.trim(),
      commissionAmount,
      consumables,
      notes: `Stylist: ${stylistName.trim()} | Incentive: ₹${commissionAmount} (${commissionType === 'percentage' ? commissionValue + '%' : '₹' + commissionValue}) ${consumables.length > 0 ? '| Consumables: ' + consumables.map(c => c.name).join(', ') : ''}`,
    };

    onApplySalonService(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-900 via-purple-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/30 rounded-xl border border-pink-400/30">
              <Scissors className="w-6 h-6 text-pink-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>सैलून, स्पा व ब्यूटी पार्लर सर्विस इंजन</span>
                <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">Salon & Spa</span>
              </h2>
              <p className="text-xs text-pink-200 font-medium">
                हेयरकट, फेशियल, ब्राइडल मेकअप, स्टाइलिस्ट कमीशन व प्रोडक्ट खपत
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Service Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">सर्विस का नाम *</label>
              <input
                type="text"
                list="salon-services-list"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Hair Cut, Hair Spa, Diamond Facial, Bridal"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
              <datalist id="salon-services-list">
                <option value="Hair Cut & Beard Styling" />
                <option value="L'Oreal Hair Spa & Treatment" />
                <option value="O3+ Diamond Facial" />
                <option value="Bridal / Groom Makeup Package" />
                <option value="Head Massage & Hair Wash" />
                <option value="Manicure & Pedicure" />
                <option value="Keratin / Hair Smoothening" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">श्रेणी (Gender / Type)</label>
              <select
                value={customerGender}
                onChange={(e) => setCustomerGender(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="Men">पुरुष (Men / Groom)</option>
                <option value="Women">महिला (Women / Bridal)</option>
                <option value="Kids">बच्चे (Kids)</option>
                <option value="Unisex">यूनिसेक्स (Unisex)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Stylist Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">सर्विस चार्ज (Price ₹) *</label>
              <input
                type="number"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
                placeholder="350"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-black text-pink-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">स्टाइलिस्ट / ब्यूटीशियन का नाम *</label>
              <input
                type="text"
                value={stylistName}
                onChange={(e) => setStylistName(e.target.value)}
                placeholder="e.g. Raju, Pooja, Imran"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          {/* Stylist Incentive / Commission */}
          <div className="bg-pink-50/60 p-4 rounded-xl border border-pink-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-pink-950 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign size={14} className="text-pink-600" />
                <span>स्टाइलिस्ट कमीशन / इंसेंटिव (Staff Commission)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCommissionType("percentage")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    commissionType === "percentage" ? "bg-pink-600 text-white shadow" : "bg-white text-slate-700 border"
                  }`}
                >
                  प्रतिशत (%)
                </button>
                <button
                  type="button"
                  onClick={() => setCommissionType("fixed")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    commissionType === "fixed" ? "bg-pink-600 text-white shadow" : "bg-white text-slate-700 border"
                  }`}
                >
                  फिक्स रकम (₹)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  कमीशन दर ({commissionType === "percentage" ? "%" : "₹"})
                </label>
                <input
                  type="number"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-pink-300 font-bold bg-white font-mono"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-pink-200 text-xs">
                <span className="text-slate-500 block text-[10px]">स्टाइलिस्ट को देय कमीशन:</span>
                <span className="text-base font-black text-pink-700 font-mono">₹{commissionAmount}</span>
                <span className="text-[10px] text-slate-400 block">सैलरी/इंसेंटिव रिपोर्ट में स्वतः जुड़ेगा</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl font-black text-xs shadow-lg transition"
            >
              💇 सर्विस व कमीशन बिल में जोड़ें (+ Add to Invoice)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
