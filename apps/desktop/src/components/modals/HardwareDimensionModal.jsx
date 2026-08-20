import React, { useState } from "react";
import { X, Calculator, Layers, Paintbrush, Ruler, CheckCircle2, ArrowRight } from "lucide-react";

export default function HardwareDimensionModal({ isOpen, onClose, onApplyItem }) {
  const [activeTab, setActiveTab] = useState("area"); // "area" | "steel" | "paint"

  // 1. Area / Dimension State (Plywood, Tiles, Glass, Granite)
  const [areaForm, setAreaForm] = useState({
    materialName: "Commercial Plywood 18mm",
    unitType: "feet", // "feet" | "inches" | "mm" | "meter"
    length: 8,
    width: 4,
    pieces: 5,
    ratePerSqFt: 65,
  });

  // 2. TMT Steel Bar State
  const [steelForm, setSteelForm] = useState({
    brand: "Tata Tiscon / Jindal Panther TMT",
    diameter: "12", // 8, 10, 12, 16, 20, 25, 32
    lengthMeters: 12, // Standard length in meters
    pieces: 10,
    ratePerKg: 68,
  });

  // 3. Paint Shade State
  const [paintForm, setPaintForm] = useState({
    brand: "Asian Paints",
    productLine: "Apex Ultima Exterior Emulsion",
    shadeCode: "0512",
    shadeName: "Royal Ivory",
    paintBase: "Base 1 (White)",
    packSize: 20, // in Litres
    packQuantity: 2,
    ratePerPack: 4800,
  });

  if (!isOpen) return null;

  // Area Calculations
  const calculateArea = () => {
    let l = parseFloat(areaForm.length) || 0;
    let w = parseFloat(areaForm.width) || 0;
    let pcs = parseFloat(areaForm.pieces) || 1;

    let sqFtPerPiece = 0;
    if (areaForm.unitType === "feet") {
      sqFtPerPiece = l * w;
    } else if (areaForm.unitType === "inches") {
      sqFtPerPiece = (l * w) / 144;
    } else if (areaForm.unitType === "mm") {
      sqFtPerPiece = (l * w) / 92903.04;
    } else if (areaForm.unitType === "meter") {
      sqFtPerPiece = l * w * 10.7639;
    }

    const totalSqFt = sqFtPerPiece * pcs;
    const totalSqMtr = totalSqFt / 10.7639;
    const totalAmount = totalSqFt * (parseFloat(areaForm.ratePerSqFt) || 0);

    return {
      sqFtPerPiece: sqFtPerPiece.toFixed(2),
      totalSqFt: totalSqFt.toFixed(2),
      totalSqMtr: totalSqMtr.toFixed(2),
      totalAmount: Math.round(totalAmount),
    };
  };

  // Steel Weight Calculations (Standard formula: D^2 / 162 kg per meter)
  const calculateSteelWeight = () => {
    const d = parseFloat(steelForm.diameter) || 12;
    const l = parseFloat(steelForm.lengthMeters) || 12;
    const pcs = parseFloat(steelForm.pieces) || 1;
    const rate = parseFloat(steelForm.ratePerKg) || 0;

    // Weight per meter in kg = (D^2) / 162
    const weightPerMeter = (d * d) / 162;
    const weightPerPiece = weightPerMeter * l;
    const totalWeightKg = weightPerPiece * pcs;
    const totalTons = totalWeightKg / 1000;
    const totalAmount = totalWeightKg * rate;

    return {
      weightPerPiece: weightPerPiece.toFixed(2),
      totalWeightKg: totalWeightKg.toFixed(2),
      totalTons: totalTons.toFixed(3),
      totalAmount: Math.round(totalAmount),
    };
  };

  // Paint Calculations
  const calculatePaint = () => {
    const pack = parseFloat(paintForm.packSize) || 20;
    const qty = parseFloat(paintForm.packQuantity) || 1;
    const rate = parseFloat(paintForm.ratePerPack) || 0;

    const totalLitres = pack * qty;
    const totalAmount = qty * rate;

    return {
      totalLitres,
      totalAmount: Math.round(totalAmount),
    };
  };

  const areaResult = calculateArea();
  const steelResult = calculateSteelWeight();
  const paintResult = calculatePaint();

  // Apply to Bill handlers
  const handleApplyArea = () => {
    onApplyItem({
      name: `${areaForm.materialName} (${areaForm.length}x${areaForm.width} ${areaForm.unitType}, ${areaForm.pieces} pcs)`,
      category: "Hardware & Plywood",
      quantity: parseFloat(areaResult.totalSqFt),
      unit: "sqft",
      rate: parseFloat(areaForm.ratePerSqFt) || 0,
      dimensions: `${areaForm.length}x${areaForm.width} ${areaForm.unitType}`,
      notes: `${areaForm.pieces} pieces = ${areaResult.totalSqFt} Sq.Ft (${areaResult.totalSqMtr} Sq.Mtr)`,
    });
    onClose();
  };

  const handleApplySteel = () => {
    onApplyItem({
      name: `${steelForm.brand} ${steelForm.diameter}mm TMT (${steelForm.pieces} pcs / ${steelForm.lengthMeters}m)`,
      category: "Building Materials & Steel",
      quantity: parseFloat(steelResult.totalWeightKg),
      unit: "kg",
      rate: parseFloat(steelForm.ratePerKg) || 0,
      dimensions: `${steelForm.diameter}mm x ${steelForm.lengthMeters}m`,
      notes: `${steelForm.pieces} rods (${steelForm.diameter}mm) = ${steelResult.totalWeightKg} Kg (${steelResult.totalTons} Tons)`,
    });
    onClose();
  };

  const handleApplyPaint = () => {
    onApplyItem({
      name: `${paintForm.brand} ${paintForm.productLine} [Shade: ${paintForm.shadeCode} - ${paintForm.shadeName}] (${paintForm.paintBase})`,
      category: "Paints & Wall Finishes",
      quantity: parseFloat(paintForm.packQuantity),
      unit: `${paintForm.packSize}L Pack`,
      rate: parseFloat(paintForm.ratePerPack) || 0,
      shadeCode: paintForm.shadeCode,
      paintBase: paintForm.paintBase,
      notes: `Shade: ${paintForm.shadeCode} (${paintForm.shadeName}) | ${paintForm.paintBase} | Total: ${paintResult.totalLitres} Litres`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30">
              <Calculator className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                <span>हार्डवेयर, पेंट्स व सरिया स्मार्ट कैलकुलेटर</span>
              </h2>
              <p className="text-xs text-blue-200 font-medium">
                Dimensions, Weight & Paint Shade Calculator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tab Navigation */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("area")}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "area"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>1. Area (प्लाई/टाइल्स)</span>
          </button>

          <button
            onClick={() => setActiveTab("steel")}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "steel"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. सरिया / TMT Steel</span>
          </button>

          <button
            onClick={() => setActiveTab("paint")}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === "paint"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span>3. पेंट शेड व टिनटिंग</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* TAB 1: AREA / DIMENSION CALCULATOR */}
          {activeTab === "area" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">आइटम का नाम / प्रकार</label>
                <input
                  type="text"
                  value={areaForm.materialName}
                  onChange={(e) => setAreaForm({ ...areaForm, materialName: e.target.value })}
                  placeholder="e.g. Gurjan Plywood 18mm, Floor Tiles 2x2, Toughened Glass"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">इकाई (Unit)</label>
                  <select
                    value={areaForm.unitType}
                    onChange={(e) => setAreaForm({ ...areaForm, unitType: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="feet">Feet (ft)</option>
                    <option value="inches">Inches (in)</option>
                    <option value="mm">Millimeters (mm)</option>
                    <option value="meter">Meters (m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">लंबाई (Length)</label>
                  <input
                    type="number"
                    value={areaForm.length}
                    onChange={(e) => setAreaForm({ ...areaForm, length: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">चौड़ाई (Width)</label>
                  <input
                    type="number"
                    value={areaForm.width}
                    onChange={(e) => setAreaForm({ ...areaForm, width: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कुल पीस (Sheets)</label>
                  <input
                    type="number"
                    value={areaForm.pieces}
                    onChange={(e) => setAreaForm({ ...areaForm, pieces: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">रेट प्रति Sq. Ft (₹)</label>
                <input
                  type="number"
                  value={areaForm.ratePerSqFt}
                  onChange={(e) => setAreaForm({ ...areaForm, ratePerSqFt: e.target.value })}
                  placeholder="₹ per Sq.Ft"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-bold text-blue-700"
                />
              </div>

              {/* Live Calculation Preview Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-700 font-bold">1 पीस = {areaResult.sqFtPerPiece} Sq.Ft</div>
                  <div className="text-sm font-black text-slate-900">
                    कुल एरिया: <span className="text-blue-700">{areaResult.totalSqFt} Sq.Ft</span> ({areaResult.totalSqMtr} Sq.Mtr)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">कुल रकम</div>
                  <div className="text-xl font-black text-blue-800">₹{areaResult.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <button
                onClick={handleApplyArea}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>+ बिल में जोड़ें ({areaResult.totalSqFt} Sq.Ft @ ₹{areaForm.ratePerSqFt})</span>
              </button>
            </div>
          )}

          {/* TAB 2: TMT STEEL BAR WEIGHT CALCULATOR */}
          {activeTab === "steel" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ब्रांड / कंपनी</label>
                <input
                  type="text"
                  value={steelForm.brand}
                  onChange={(e) => setSteelForm({ ...steelForm, brand: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">सरिया का साइज (Dia)</label>
                  <select
                    value={steelForm.diameter}
                    onChange={(e) => setSteelForm({ ...steelForm, diameter: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white text-indigo-700"
                  >
                    <option value="8">8 mm (Soot 2.5)</option>
                    <option value="10">10 mm (Soot 3)</option>
                    <option value="12">12 mm (Soot 4)</option>
                    <option value="16">16 mm (Soot 5)</option>
                    <option value="20">20 mm (Soot 6)</option>
                    <option value="25">25 mm (Soot 8)</option>
                    <option value="32">32 mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">लंबाई (Meters)</label>
                  <input
                    type="number"
                    value={steelForm.lengthMeters}
                    onChange={(e) => setSteelForm({ ...steelForm, lengthMeters: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कुल पीस (Rods)</label>
                  <input
                    type="number"
                    value={steelForm.pieces}
                    onChange={(e) => setSteelForm({ ...steelForm, pieces: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रेट प्रति Kg (₹)</label>
                  <input
                    type="number"
                    value={steelForm.ratePerKg}
                    onChange={(e) => setSteelForm({ ...steelForm, ratePerKg: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Steel Calculation Preview Card */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-700 font-bold">1 रॉड = {steelResult.weightPerPiece} Kg</div>
                  <div className="text-sm font-black text-slate-900">
                    कुल वजन: <span className="text-indigo-700">{steelResult.totalWeightKg} Kg</span> ({steelResult.totalTons} टन)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">कुल रकम</div>
                  <div className="text-xl font-black text-indigo-900">₹{steelResult.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <button
                onClick={handleApplySteel}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>+ बिल में जोड़ें ({steelResult.totalWeightKg} Kg @ ₹{steelForm.ratePerKg}/Kg)</span>
              </button>
            </div>
          )}

          {/* TAB 3: PAINT SHADE & TINTING */}
          {activeTab === "paint" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पेंट कंपनी</label>
                  <select
                    value={paintForm.brand}
                    onChange={(e) => setPaintForm({ ...paintForm, brand: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Asian Paints">Asian Paints</option>
                    <option value="Berger Paints">Berger Paints</option>
                    <option value="Nerolac">Nerolac Paints</option>
                    <option value="Dulux">Dulux</option>
                    <option value="Indigo Paints">Indigo Paints</option>
                    <option value="Birla Opus">Birla Opus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">प्रोडक्ट लाइन / टाइप</label>
                  <input
                    type="text"
                    value={paintForm.productLine}
                    onChange={(e) => setPaintForm({ ...paintForm, productLine: e.target.value })}
                    placeholder="e.g. Apex Ultima, Royale Luxury, Tractor Emulsion"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">शेड कोड (Code)</label>
                  <input
                    type="text"
                    value={paintForm.shadeCode}
                    onChange={(e) => setPaintForm({ ...paintForm, shadeCode: e.target.value })}
                    placeholder="e.g. 0512, 8245"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold text-emerald-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कलर / शेड नाम</label>
                  <input
                    type="text"
                    value={paintForm.shadeName}
                    onChange={(e) => setPaintForm({ ...paintForm, shadeName: e.target.value })}
                    placeholder="e.g. Royal Ivory"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बेस टाइप (Base)</label>
                  <select
                    value={paintForm.paintBase}
                    onChange={(e) => setPaintForm({ ...paintForm, paintBase: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Base 1 (White)">Base 1 (White)</option>
                    <option value="Base 2 (Deep)">Base 2 (Deep)</option>
                    <option value="Base 3 (Yellow)">Base 3 (Yellow)</option>
                    <option value="Base 4 (Red)">Base 4 (Red)</option>
                    <option value="Direct Shade">Direct Shade</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पैक साइज (Pack)</label>
                  <select
                    value={paintForm.packSize}
                    onChange={(e) => setPaintForm({ ...paintForm, packSize: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="20">20 Ltr (ड्रम/बाल्टी)</option>
                    <option value="10">10 Ltr (बाल्टी)</option>
                    <option value="4">4 Ltr (कैन)</option>
                    <option value="1">1 Ltr (डिब्बा)</option>
                    <option value="0.5">500 ml</option>
                    <option value="0.2">200 ml</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">पैक्स की संख्या (Qty)</label>
                  <input
                    type="number"
                    value={paintForm.packQuantity}
                    onChange={(e) => setPaintForm({ ...paintForm, packQuantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">रेट प्रति पैक (₹)</label>
                  <input
                    type="number"
                    value={paintForm.ratePerPack}
                    onChange={(e) => setPaintForm({ ...paintForm, ratePerPack: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Paint Calculation Preview Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-700 font-bold">
                    शेड: {paintForm.shadeCode} ({paintForm.shadeName}) • {paintForm.paintBase}
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    कुल मात्रा: <span className="text-emerald-700">{paintResult.totalLitres} Litres</span> ({paintForm.packQuantity} × {paintForm.packSize}L)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">कुल रकम</div>
                  <div className="text-xl font-black text-emerald-900">₹{paintResult.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <button
                onClick={handleApplyPaint}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>+ बिल में जोड़ें ({paintForm.packQuantity} × {paintForm.packSize}L @ ₹{paintForm.ratePerPack})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
