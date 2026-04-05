import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/authmiddleware.js';

const router = express.Router();

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortCode: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

router.get('/', protect, async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const { name, shortCode } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const category = new Category({ name, shortCode });
        await category.save();
        res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const { name, shortCode, isActive } = req.body;
        const category = await Category.findByIdAndUpdate(req.params.id, { name, shortCode, isActive }, { new: true });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category updated', category });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;