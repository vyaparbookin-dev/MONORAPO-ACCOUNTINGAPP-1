import mongoose from 'mongoose';
import Medicine from '../models/medicine.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendMedicalError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid medicine data' : 'Unable to process medicine request',
    error: error.message,
  });
};

export const getMedicines = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const medicines = await Medicine.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: medicines });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const medicine = await Medicine.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Medicine created successfully', data: medicine });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.status(200).json({ success: true, message: 'Medicine updated successfully', data: medicine });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({
      companyId: req.companyId,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    }).sort({ stockQuantity: 1 });

    res.status(200).json({ success: true, data: medicines });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const getExpiringMedicines = async (req, res) => {
  try {
    const today = new Date();
    const next90Days = new Date();
    next90Days.setDate(today.getDate() + 90);

    const medicines = await Medicine.find({
      companyId: req.companyId,
      expiryDate: {
        $ne: null,
        $gte: today,
        $lte: next90Days,
      },
    }).sort({ expiryDate: 1 });

    res.status(200).json({ success: true, data: medicines });
  } catch (error) {
    sendMedicalError(res, error);
  }
};

export const getMedicineSummary = async (req, res) => {
  try {
    const [total, lowStock, expiring, prescriptionRequired] = await Promise.all([
      Medicine.countDocuments({ companyId: req.companyId }),
      Medicine.countDocuments({ companyId: req.companyId, $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
      Medicine.countDocuments({
        companyId: req.companyId,
        expiryDate: {
          $ne: null,
          $gte: new Date(),
          $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      }),
      Medicine.countDocuments({ companyId: req.companyId, prescriptionRequired: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        lowStock,
        expiring,
        prescriptionRequired,
      },
    });
  } catch (error) {
    sendMedicalError(res, error);
  }
};
