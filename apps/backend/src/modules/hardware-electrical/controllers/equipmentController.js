import mongoose from 'mongoose';
import Equipment from '../models/equipment.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendEquipmentError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid equipment data' : 'Unable to process equipment request',
    error: error.message,
  });
};

export const getEquipment = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const items = await Equipment.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};

export const getEquipmentById = async (req, res) => {
  try {
    const item = await Equipment.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};

export const createEquipment = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const item = await Equipment.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Equipment created successfully', data: item });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};

export const updateEquipment = async (req, res) => {
  try {
    const item = await Equipment.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.status(200).json({ success: true, message: 'Equipment updated successfully', data: item });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    const item = await Equipment.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.status(200).json({ success: true, message: 'Equipment deleted successfully' });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};

export const getLowStockEquipment = async (req, res) => {
  try {
    const items = await Equipment.find({
      companyId: req.companyId,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    }).sort({ stockQuantity: 1 });

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};

export const getEquipmentSummary = async (req, res) => {
  try {
    const [total, lowStock] = await Promise.all([
      Equipment.countDocuments({ companyId: req.companyId }),
      Equipment.countDocuments({ companyId: req.companyId, $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        lowStock,
      },
    });
  } catch (error) {
    sendEquipmentError(res, error);
  }
};
