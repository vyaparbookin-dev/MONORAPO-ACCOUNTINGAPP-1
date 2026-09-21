import mongoose from 'mongoose';
import Cloth from '../models/cloth.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendClothError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid cloth item data' : 'Unable to process cloth item request',
    error: error.message,
  });
};

export const getClothItems = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const items = await Cloth.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendClothError(res, error);
  }
};

export const getClothItemById = async (req, res) => {
  try {
    const item = await Cloth.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cloth item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    sendClothError(res, error);
  }
};

export const createClothItem = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const item = await Cloth.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Cloth item created successfully', data: item });
  } catch (error) {
    sendClothError(res, error);
  }
};

export const updateClothItem = async (req, res) => {
  try {
    const item = await Cloth.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cloth item not found' });
    }

    res.status(200).json({ success: true, message: 'Cloth item updated successfully', data: item });
  } catch (error) {
    sendClothError(res, error);
  }
};

export const deleteClothItem = async (req, res) => {
  try {
    const item = await Cloth.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cloth item not found' });
    }

    res.status(200).json({ success: true, message: 'Cloth item deleted successfully' });
  } catch (error) {
    sendClothError(res, error);
  }
};

export const getLowStockClothItems = async (req, res) => {
  try {
    const items = await Cloth.find({
      companyId: req.companyId,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] },
    }).sort({ stockQuantity: 1 });

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendClothError(res, error);
  }
};

export const getClothSummary = async (req, res) => {
  try {
    const [total, lowStock] = await Promise.all([
      Cloth.countDocuments({ companyId: req.companyId }),
      Cloth.countDocuments({ companyId: req.companyId, $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        lowStock,
      },
    });
  } catch (error) {
    sendClothError(res, error);
  }
};
