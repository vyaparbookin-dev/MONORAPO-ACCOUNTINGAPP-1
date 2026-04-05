import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortCode: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);

router.get('/', protect, async (req, res) => {
    try {
        const brands = await Brand.find().sort({ createdAt: -1 });
        res.status(200).json({ brands });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { name, shortCode } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const brand = new Brand({ name, shortCode });
        await brand.save();
        res.status(201).json({ message: 'Brand created', brand });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const { name, shortCode, isActive } = req.body;
        const brand = await Brand.findByIdAndUpdate(req.params.id, { name, shortCode, isActive }, { new: true });
        res.status(200).json({ message: 'Brand updated', brand });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        await Brand.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Brand deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;