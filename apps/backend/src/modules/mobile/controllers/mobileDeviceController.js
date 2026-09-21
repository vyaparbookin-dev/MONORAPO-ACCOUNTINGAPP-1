import mongoose from 'mongoose';
import MobileDevice from '../models/mobileDevice.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendMobileError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid mobile device data' : 'Unable to process mobile device request',
    error: error.message,
  });
};

export const getMobileDevices = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const devices = await MobileDevice.find({ companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    sendMobileError(res, error);
  }
};

export const getMobileDeviceById = async (req, res) => {
  try {
    const device = await MobileDevice.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Mobile device not found' });
    }

    res.status(200).json({ success: true, data: device });
  } catch (error) {
    sendMobileError(res, error);
  }
};

export const createMobileDevice = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const device = await MobileDevice.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Mobile device created successfully', data: device });
  } catch (error) {
    sendMobileError(res, error);
  }
};

export const updateMobileDevice = async (req, res) => {
  try {
    const device = await MobileDevice.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, message: 'Mobile device not found' });
    }

    res.status(200).json({ success: true, message: 'Mobile device updated successfully', data: device });
  } catch (error) {
    sendMobileError(res, error);
  }
};

export const deleteMobileDevice = async (req, res) => {
  try {
    const device = await MobileDevice.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Mobile device not found' });
    }

    res.status(200).json({ success: true, message: 'Mobile device deleted successfully' });
  } catch (error) {
    sendMobileError(res, error);
  }
};

export const getMobileSummary = async (req, res) => {
  try {
    const [total, inStock, repair] = await Promise.all([
      MobileDevice.countDocuments({ companyId: req.companyId }),
      MobileDevice.countDocuments({ companyId: req.companyId, status: 'active' }),
      MobileDevice.countDocuments({ companyId: req.companyId, status: 'repair' }),
    ]);

    res.status(200).json({ success: true, data: { total, inStock, repair } });
  } catch (error) {
    sendMobileError(res, error);
  }
};
