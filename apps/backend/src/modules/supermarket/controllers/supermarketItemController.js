import mongoose from 'mongoose';
import SupermarketItem from '../models/supermarketItem.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendSupermarketError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid supermarket item data' : 'Unable to process supermarket item request',
    error: error.message,
  });
};

export const getSupermarketItems = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const items = await SupermarketItem.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendSupermarketError(res, error);
  }
};

export const getSupermarketItemById = async (req, res) => {
  try {
    const item = await SupermarketItem.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Supermarket item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    sendSupermarketError(res, error);
  }
};

export const createSupermarketItem = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const item = await SupermarketItem.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Supermarket item created successfully', data: item });
  } catch (error) {
    sendSupermarketError(res, error);
  }
};

export const updateSupermarketItem = async (req, res) => {
  try {
    const item = await SupermarketItem.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Supermarket item not found' });
    }

    res.status(200).json({ success: true, message: 'Supermarket item updated successfully', data: item });
  } catch (error) {
    sendSupermarketError(res, error);
  }
};

export const deleteSupermarketItem = async (req, res) => {
  try {
    const item = await SupermarketItem.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Supermarket item not found' });
    }

    res.status(200).json({ success: true, message: 'Supermarket item deleted successfully' });
  } catch (error) {
    sendSupermarketError(res, error);
  }
};

export const getSupermarketSummary = async (req, res) => {
  try {
    const [total, active, lowStock] = await Promise.all([
      SupermarketItem.countDocuments({ companyId: req.companyId }),
      SupermarketItem.countDocuments({ companyId: req.companyId, status: 'active' }),
      SupermarketItem.countDocuments({ companyId: req.companyId, $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
    ]);

    res.status(200).json({ success: true, data: { total, active, lowStock } });
  } catch (error) {
    sendSupermarketError(res, error);
  }
};
