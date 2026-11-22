import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  hsnCode: { type: String, default: "8481" },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: "PCS" },
  rate: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 }
}, { _id: false });

const vehicleUpdateSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true },
  fromPlace: { type: String, default: "" },
  fromState: { type: String, default: "" },
  reason: { type: String, default: "Breakdown/Transshipment" },
  transDocNo: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const eWayBillSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
  transferId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockTransfer', default: null },
  
  // Document Type & Meta
  docType: { type: String, enum: ['INV', 'BIL', 'CHL', 'OTH'], default: 'INV' },
  invoiceNumber: { type: String, required: true, index: true },
  docDate: { type: Date, default: Date.now },
  subType: { type: String, default: 'Supply' }, // Supply, Transfer, Job Work, Export, Others
  supplyType: { type: String, enum: ['O', 'I'], default: 'O' }, // Outward, Inward
  
  // E-Way Bill Number (12 Digit standard format)
  ewayBillNumber: { type: String, index: true },
  generatedDate: { type: Date, default: Date.now },
  validUpto: { type: Date, required: true },
  distance: { type: Number, default: 20 }, // in KM
  
  // E-Invoice (IRN Portal Integration)
  isEInvoice: { type: Boolean, default: false },
  irn: { type: String, index: true }, // 64-char Hash
  ackNo: { type: String }, // 15-16 digit Acknowledgement
  ackDate: { type: Date },
  signedQrCode: { type: String }, // String content of official QR code
  qrCodeImage: { type: String }, // Base64 data URL for instant display/print
  
  // Consignor / Dispatch Details (Seller)
  fromGstin: { type: String, default: "22AAAAA0000A1Z5" },
  fromTradeName: { type: String, default: "Ganesh Hardware" },
  fromAddress: { type: String, default: "Bharat mata chowk sarangarh" },
  fromPincode: { type: String, default: "496450" },
  fromState: { type: String, default: "Chhattisgarh (22)" },
  
  // Consignee / Ship-to Details (Buyer)
  toGstin: { type: String, default: "URP" }, // URP if unregistered party
  toTradeName: { type: String, required: true },
  toAddress: { type: String, default: "Sarangarh" },
  toPincode: { type: String, default: "496450" },
  toState: { type: String, default: "Chhattisgarh (22)" },

  // Valuation & Tax
  taxableAmount: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  cessAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  items: [itemSchema],
  
  // Part-B / Transporter Information
  mode: { type: String, enum: ['Road', 'Rail', 'Air', 'Ship'], default: 'Road' },
  vehicleNumber: { type: String, default: "" },
  vehicleType: { type: String, enum: ['Regular', 'ODC'], default: 'Regular' },
  transporterId: { type: String, default: "" },
  transporterName: { type: String, default: "" },
  transDocNo: { type: String, default: "" },
  transDocDate: { type: Date, default: null },
  vehicleUpdates: [vehicleUpdateSchema],

  // Status & Tracking
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  cancelReason: { type: String, default: "" },
  cancelDate: { type: Date, default: null },
  
  // NIC Official Schema JSON Payload
  nicJson: { type: Object, default: null }
}, { timestamps: true });

export default mongoose.model("EWayBill", eWayBillSchema);
