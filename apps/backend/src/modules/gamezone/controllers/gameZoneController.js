import mongoose from 'mongoose';
import GameZoneItem from '../models/gameZoneItem.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendGameZoneError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid game zone item data' : 'Unable to process game zone item request',
    error: error.message,
  });
};

export const getGameZoneItems = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const items = await GameZoneItem.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    sendGameZoneError(res, error);
  }
};

export const getGameZoneItemById = async (req, res) => {
  try {
    const item = await GameZoneItem.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Game zone item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    sendGameZoneError(res, error);
  }
};

export const createGameZoneItem = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const item = await GameZoneItem.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Game zone item created successfully', data: item });
  } catch (error) {
    sendGameZoneError(res, error);
  }
};

export const updateGameZoneItem = async (req, res) => {
  try {
    const item = await GameZoneItem.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Game zone item not found' });
    }

    res.status(200).json({ success: true, message: 'Game zone item updated successfully', data: item });
  } catch (error) {
    sendGameZoneError(res, error);
  }
};

export const deleteGameZoneItem = async (req, res) => {
  try {
    const item = await GameZoneItem.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Game zone item not found' });
    }

    res.status(200).json({ success: true, message: 'Game zone item deleted successfully' });
  } catch (error) {
    sendGameZoneError(res, error);
  }
};

export const getGameZoneSummary = async (req, res) => {
  try {
    const [total, active, maintenance] = await Promise.all([
      GameZoneItem.countDocuments({ companyId: req.companyId }),
      GameZoneItem.countDocuments({ companyId: req.companyId, status: 'active' }),
      GameZoneItem.countDocuments({ companyId: req.companyId, status: 'maintenance' }),
    ]);

    res.status(200).json({ success: true, data: { total, active, maintenance } });
  } catch (error) {
    sendGameZoneError(res, error);
  }
};
