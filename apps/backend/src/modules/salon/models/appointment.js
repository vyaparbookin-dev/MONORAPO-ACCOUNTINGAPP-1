import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  stylist: {
    type: String,
    trim: true,
  },
  service: {
    type: String,
    trim: true,
  },
  packageName: {
    type: String,
    trim: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  amount: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
  },
}, { timestamps: true });

appointmentSchema.index({ companyId: 1, appointmentDate: 1 });

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
