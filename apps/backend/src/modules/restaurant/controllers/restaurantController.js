import mongoose from 'mongoose';
import RestaurantMenuItem from '../models/restaurantMenuItem.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendRestaurantError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid restaurant menu item data' : 'Unable to process restaurant menu item request',
    error: error.message,
  });
};

export const getRestaurantMenuItems = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const items = await RestaurantMenuItem.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendRestaurantError(res, error);
  }
};

export const getRestaurantMenuItemById = async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Restaurant menu item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    sendRestaurantError(res, error);
  }
};

export const createRestaurantMenuItem = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const item = await RestaurantMenuItem.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Restaurant menu item created successfully', data: item });
  } catch (error) {
    sendRestaurantError(res, error);
  }
};

export const updateRestaurantMenuItem = async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Restaurant menu item not found' });
    }

    res.status(200).json({ success: true, message: 'Restaurant menu item updated successfully', data: item });
  } catch (error) {
    sendRestaurantError(res, error);
  }
};

export const deleteRestaurantMenuItem = async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Restaurant menu item not found' });
    }

    res.status(200).json({ success: true, message: 'Restaurant menu item deleted successfully' });
  } catch (error) {
    sendRestaurantError(res, error);
  }
};

export const getRestaurantSummary = async (req, res) => {
  try {
    const [total, active, lowStock] = await Promise.all([
      RestaurantMenuItem.countDocuments({ companyId: req.companyId }),
      RestaurantMenuItem.countDocuments({ companyId: req.companyId, status: 'active' }),
      RestaurantMenuItem.countDocuments({ companyId: req.companyId, $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
    ]);

    res.status(200).json({ success: true, data: { total, active, lowStock } });
  } catch (error) {
    sendRestaurantError(res, error);
  }
};
