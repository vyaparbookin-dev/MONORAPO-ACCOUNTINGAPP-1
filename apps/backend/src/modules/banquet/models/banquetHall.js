import mongoose from "mongoose";

const banquetHallSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  venueType: { 
    type: String, 
    enum: ["hall", "lawn", "rooftop", "poolside", "conference_room"], 
    default: "hall" 
  },
  capacitySeated: { type: Number, default: 100 },
  capacityFloating: { type: Number, default: 150 },
  baseRent: { type: Number, default: 0 },
  minPaxGuaranteed: { type: Number, default: 50 },
  freeHallMinPax: { type: Number, default: 75 }, // If pax >= this, hall rent is ₹0
  lowPaxHallRent: { type: Number, default: 10000 }, // If pax < freeHallMinPax, charge this
  amenities: [{ type: String }], // Central AC, Stage, DJ Lights, Generator Backup, Green Room, Valet Parking
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.BanquetHall || mongoose.model("BanquetHall", banquetHallSchema);
