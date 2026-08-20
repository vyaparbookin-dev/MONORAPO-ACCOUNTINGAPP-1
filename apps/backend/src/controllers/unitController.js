import Unit from "../model/unit.js";

// Standard Indian business units
const STANDARD_UNITS = [
  { name: "Pieces", shortName: "PCS", isCompound: false },
  { name: "Kilogram", shortName: "KG", isCompound: false },
  { name: "Gram", shortName: "GM", isCompound: false },
  { name: "Litre", shortName: "LTR", isCompound: false },
  { name: "Millilitre", shortName: "ML", isCompound: false },
  { name: "Meter", shortName: "MTR", isCompound: false },
  { name: "Feet", shortName: "FT", isCompound: false },
  { name: "Square Feet", shortName: "SQFT", isCompound: false },
  { name: "Square Meter", shortName: "SQM", isCompound: false },
  { name: "Brass", shortName: "BRASS", isCompound: true, baseUnit: "SQFT", conversionValue: 100 },
  { name: "Bag", shortName: "BAG", isCompound: true, baseUnit: "KG", conversionValue: 50 },
  { name: "Box", shortName: "BOX", isCompound: false },
  { name: "Bundle", shortName: "BDL", isCompound: false },
  { name: "Coil", shortName: "COIL", isCompound: false },
  { name: "Ton", shortName: "TON", isCompound: true, baseUnit: "KG", conversionValue: 1000 },
  { name: "Quintal", shortName: "QTL", isCompound: true, baseUnit: "KG", conversionValue: 100 },
  { name: "Dozen", shortName: "DZN", isCompound: true, baseUnit: "PCS", conversionValue: 12 },
  { name: "Set", shortName: "SET", isCompound: false },
  { name: "Pair", shortName: "PAIR", isCompound: false },
  { name: "Can / Drum", shortName: "CAN", isCompound: false },
  { name: "Roll", shortName: "ROLL", isCompound: false },
  { name: "Sheet", shortName: "SHT", isCompound: false },
  { name: "Strip", shortName: "STRIP", isCompound: false },
  { name: "Bottle", shortName: "BTL", isCompound: false },
  { name: "Plate / Portion", shortName: "PLT", isCompound: false },
  { name: "Hour / Service", shortName: "HR", isCompound: false },
];

export const getUnits = async (req, res) => {
  try {
    const query = req.companyId ? { $or: [{ companyId: req.companyId }, { companyId: { $exists: false } }] } : {};
    let units = await Unit.find(query).sort({ name: 1 });

    // Auto-seed standard units if no units exist yet
    if (units.length === 0) {
      await Unit.insertMany(STANDARD_UNITS);
      units = await Unit.find(query).sort({ name: 1 });
    }

    res.status(200).json({ success: true, units });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createUnit = async (req, res) => {
  try {
    const { name, shortName, shortCode, isCompound, baseUnit, conversionValue } = req.body;
    const finalShortName = shortName || shortCode || name.substring(0, 4).toUpperCase();
    
    // Check if already exists for this company
    const existing = await Unit.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      $or: [{ companyId: req.companyId }, { companyId: { $exists: false } }]
    });

    if (existing) {
      return res.status(200).json({ success: true, unit: existing, message: "Unit already exists" });
    }

    const unit = new Unit({
      name: name.trim(),
      shortName: finalShortName.trim(),
      shortCode: finalShortName.trim(),
      isCompound: Boolean(isCompound),
      baseUnit: baseUnit ? baseUnit.trim() : undefined,
      conversionValue: conversionValue ? Number(conversionValue) : 1,
      companyId: req.companyId
    });

    await unit.save();
    res.status(201).json({ success: true, unit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    await Unit.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Unit deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
