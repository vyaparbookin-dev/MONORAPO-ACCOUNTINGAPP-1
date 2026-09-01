import React, { useState } from "react";
import {
  Smartphone,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Share2,
  DollarSign,
  Receipt,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  X
} from "lucide-react";

export default function OnlineFoodAggregatorModal({ isOpen, onClose, onApplyPayoutToBill }) {
  if (!isOpen) return null;

  const [platform, setPlatform] = useState("zomato"); // 'zomato' | 'swiggy' | 'magicpin' | 'eatsure'
  const [dateRange, setDateRange] = useState("Weekly Cycle (24th Aug - 30th Aug)");

  // Channel Metrics State
  const [grossFoodSales, setGrossFoodSales] = useState(38400); // Gross Billed Amount on App
  const [commissionRate, setCommissionRate] = useState(20); // 20% commission
  const [packagingCollected, setPackagingCollected] = useState(1850); // ₹1,850 packaging
  const [discountBorneByMerchant, setDiscountBorneByMerchant] = useState(3200); // 50% discount sharing
  const [penaltiesDeducted, setPenaltiesDeducted] = useState(350); // Late prep / cancellation fine
  const [tcsTdsRate, setTcsTdsRate] = useState(2); // 1% TCS + 1% TDS

  // Calculations
  const baseCommission = Math.round((grossFoodSales * commissionRate) / 100);
  const gstOnCommission = Math.round((baseCommission * 18) / 100); // 18% GST on Commission
  const totalCommissionWithGst = baseCommission + gstOnCommission;

  const tcsTdsDeducted = Math.round((grossFoodSales * tcsTdsRate) / 100);
  const totalDeductions = totalCommissionWithGst + discountBorneByMerchant + penaltiesDeducted + tcsTdsDeducted;
  
  // Net Bank Settlement (What Swiggy/Zomato actually deposits into restaurant bank account)
  const netBankPayout = (grossFoodSales + packagingCollected) - totalDeductions;
  const netTakeHomePercentage = grossFoodSales > 0 ? ((netBankPayout / grossFoodSales) * 100).toFixed(1) : 0;

  // WhatsApp Channel Payout Statement
  const shareWhatsAppSummary = () => {
    let msg = `*🛵 ${platform.toUpperCase()} WEEKLY PAYOUT & RECONCILIATION STATEMENT*\n`;
    msg += `*Settlement Cycle:* ${dateRange}\n`;
    msg += `----------------------------------\n`;
    msg += `*🟢 Gross Orders Billed on App:* ₹${grossFoodSales.toLocaleString('en-IN')}\n`;
    msg += `*+ Packaging Charges Collected:* ₹${packagingCollected.toLocaleString('en-IN')}\n`;
    msg += `----------------------------------\n`;
    msg += `*🔴 DEDUCTIONS & COMMISSIONS:*\n`;
    msg += `  • ${platform.toUpperCase()} Commission (${commissionRate}%): ₹${baseCommission.toLocaleString('en-IN')}\n`;
    msg += `  • GST on Commission (18%): ₹${gstOnCommission.toLocaleString('en-IN')}\n`;
    msg += `  • Merchant Discount Share: ₹${discountBorneByMerchant.toLocaleString('en-IN')}\n`;
    if (penaltiesDeducted > 0) {
      msg += `  • ⚠️ Late Prep / Cancellation Penalties: ₹${penaltiesDeducted.toLocaleString('en-IN')}\n`;
    }
    msg += `  • Govt. TCS + TDS (2%): ₹${tcsTdsDeducted.toLocaleString('en-IN')}\n`;
    msg += `  • *Total Deductions:* -₹${totalDeductions.toLocaleString('en-IN')}\n`;
    msg += `----------------------------------\n`;
    msg += `*💰 NET ACTUAL BANK CREDIT (जमा रकम):* *₹${netBankPayout.toLocaleString('en-IN')}* (*${netTakeHomePercentage}%* of Gross)\n`;
    msg += `----------------------------------\n`;
    msg += `_Reconciled via Monorepo Accounting App._`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleApplySettlement = () => {
    if (onApplyPayoutToBill) {
      onApplyPayoutToBill({
        name: `${platform.toUpperCase()} Weekly Payout Settlement (${dateRange})`,
        category: "Online Aggregator Settlement",
        quantity: 1,
        rate: netBankPayout,
        unit: "CYCLE",
        total: netBankPayout,
        notes: `Gross Sales: ₹${grossFoodSales} | Commission (${commissionRate}% + GST): ₹${totalCommissionWithGst} | Discount: ₹${discountBorneByMerchant} | Penalties: ₹${penaltiesDeducted} | TCS/TDS: ₹${tcsTdsDeducted} | Packaging: ₹${packagingCollected}`
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-orange-300 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-700 p-4 px-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Smartphone size={24} className="text-yellow-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                🛵 SWIGGY, ZOMATO & ONLINE AGGREGATOR PAYOUT RECONCILIATION
              </h2>
              <p className="text-xs text-orange-100">
                कमीशन कटौती (18-24%) • डिस्काउंट शेयरिंग • लेट पेनल्टी ऑडिट • वास्तविक बैंक क्रेडिट मिलान
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          {/* Top Platform Selector */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700">Platform:</span>
              <div className="flex gap-2">
                {[
                  { id: "zomato", label: "🔴 Zomato", rate: 20 },
                  { id: "swiggy", label: "🟠 Swiggy", rate: 22 },
                  { id: "magicpin", label: "🔵 Magicpin", rate: 12 },
                  { id: "eatsure", label: "🟣 EatSure", rate: 15 },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setPlatform(item.id); setCommissionRate(item.rate); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                      platform === item.id
                        ? "bg-slate-900 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-gray-500">Payout Cycle:</span>
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-xs font-bold text-orange-950 px-2 py-1 border rounded bg-orange-50/50 ml-2"
              />
            </div>
          </div>

          {/* 3 Main Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-xs font-bold text-blue-900 uppercase">Gross App Sales (कुल आर्डर)</span>
              <p className="text-2xl font-black text-blue-950 mt-1">₹{grossFoodSales.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-blue-700 mt-0.5">Billed to Customers on {platform.toUpperCase()}</p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-xs font-bold text-rose-900 uppercase">Total Deductions (कमीशन + पेनल्टी)</span>
              <p className="text-2xl font-black text-rose-700 mt-1">-₹{totalDeductions.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-rose-600 mt-0.5">Comm. ({commissionRate}%) + GST + Discounts + Fine</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-xl shadow">
              <span className="text-xs font-bold text-emerald-300 uppercase">Net Bank Credit (खाते में आया)</span>
              <p className="text-2xl font-black text-yellow-300 mt-1">₹{netBankPayout.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-emerald-200 font-bold mt-0.5">✓ Take Home Ratio: {netTakeHomePercentage}%</p>
            </div>
          </div>

          {/* Detailed Deductions Breakdown Table */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-black text-gray-900 text-sm border-b pb-2 flex items-center justify-between">
              <span>📋 Statement Items & Deduction Details</span>
              <span className="text-xs text-orange-600 font-bold">Edit any value to match your weekly PDF statement</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <label className="font-bold text-gray-700">Gross Food Sales (₹)</label>
                <input
                  type="number"
                  value={grossFoodSales}
                  onChange={(e) => setGrossFoodSales(parseFloat(e.target.value) || 0)}
                  className="w-full font-black text-base px-2 py-1 border rounded bg-white text-gray-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <label className="font-bold text-gray-700">Platform Commission %</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-20 font-black text-base px-2 py-1 border rounded bg-white text-gray-900 text-center"
                  />
                  <span className="text-gray-500 font-semibold">= ₹{baseCommission} (+18% GST ₹{gstOnCommission})</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <label className="font-bold text-gray-700">Packaging Charges Collected (+₹)</label>
                <input
                  type="number"
                  value={packagingCollected}
                  onChange={(e) => setPackagingCollected(parseFloat(e.target.value) || 0)}
                  className="w-full font-black text-base px-2 py-1 border rounded bg-white text-green-700"
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <label className="font-bold text-gray-700">Merchant Discount Share (-₹)</label>
                <input
                  type="number"
                  value={discountBorneByMerchant}
                  onChange={(e) => setDiscountBorneByMerchant(parseFloat(e.target.value) || 0)}
                  className="w-full font-black text-base px-2 py-1 border rounded bg-white text-rose-700"
                />
              </div>

              <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl space-y-1">
                <label className="font-bold text-red-900 flex items-center gap-1">
                  <AlertTriangle size={13} /> Late Prep / Cancellation Fine (-₹)
                </label>
                <input
                  type="number"
                  value={penaltiesDeducted}
                  onChange={(e) => setPenaltiesDeducted(parseFloat(e.target.value) || 0)}
                  className="w-full font-black text-base px-2 py-1 border border-red-300 rounded bg-white text-red-700"
                />
              </div>

              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <label className="font-bold text-gray-700">TCS (1%) + TDS (1%) Withheld (-₹)</label>
                <input
                  type="number"
                  value={tcsTdsDeducted}
                  readOnly
                  className="w-full font-black text-base px-2 py-1 border rounded bg-gray-100 text-gray-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-slate-900 text-white p-4 px-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div>
            <span className="text-[11px] text-gray-400">Net Expected Bank Settlement:</span>
            <p className="text-xl font-black text-yellow-300">₹{netBankPayout.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={shareWhatsAppSummary}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Share2 size={15} /> WhatsApp Settlement Summary
            </button>
            <button
              type="button"
              onClick={handleApplySettlement}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 size={15} /> Apply to Account Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
