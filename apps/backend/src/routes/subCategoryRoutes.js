import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortCode: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);

router.get('/', protect, async (req, res) => {
    try {
        const subCategories = await SubCategory.find().sort({ createdAt: -1 });
        res.status(200).json({ subCategories });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { name, shortCode } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const subCategory = new SubCategory({ name, shortCode });
        await subCategory.save();
        res.status(201).json({ message: 'SubCategory created', subCategory });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const { name, shortCode, isActive } = req.body;
        const subCategory = await SubCategory.findByIdAndUpdate(req.params.id, { name, shortCode, isActive }, { new: true });
        res.status(200).json({ message: 'SubCategory updated', subCategory });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        await SubCategory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'SubCategory deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;