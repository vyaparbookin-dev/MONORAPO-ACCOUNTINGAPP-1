import mongoose from 'mongoose';
import Appointment from '../models/appointment.js';

const invalidRequest = (error) => error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError;

const sendSalonError = (res, error) => {
  const status = invalidRequest(error) ? 400 : 500;
  res.status(status).json({
    success: false,
    message: status === 400 ? 'Invalid salon appointment data' : 'Unable to process salon appointment request',
    error: error.message,
  });
};

export const getAppointments = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const appointments = await Appointment.find({ companyId }).sort({ appointmentDate: -1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    sendSalonError(res, error);
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    sendSalonError(res, error);
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company ID is missing' });
    }

    const appointment = await Appointment.create({ ...req.body, companyId });
    res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
  } catch (error) {
    sendSalonError(res, error);
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, message: 'Appointment updated successfully', data: appointment });
  } catch (error) {
    sendSalonError(res, error);
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.status(200).json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    sendSalonError(res, error);
  }
};

export const getSalonSummary = async (req, res) => {
  try {
    const [total, scheduled, completed] = await Promise.all([
      Appointment.countDocuments({ companyId: req.companyId }),
      Appointment.countDocuments({ companyId: req.companyId, status: 'scheduled' }),
      Appointment.countDocuments({ companyId: req.companyId, status: 'completed' }),
    ]);

    res.status(200).json({ success: true, data: { total, scheduled, completed } });
  } catch (error) {
    sendSalonError(res, error);
  }
};
