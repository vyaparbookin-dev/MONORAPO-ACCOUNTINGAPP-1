import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Lead name is required'],
  },
  mobileNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  source: {
    type: String, // e.g., 'Walk-in', 'Phone Call', 'Website'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'unqualified', 'converted'],
    default: 'new',
  },
  notes: {
    type: String,
  },
  followUpDate: {
    type: Date,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);