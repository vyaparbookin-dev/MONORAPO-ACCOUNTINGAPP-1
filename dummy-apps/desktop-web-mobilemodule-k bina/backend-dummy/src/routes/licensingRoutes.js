import express from 'express';
// Assuming you have a 'protect' middleware to verify JWT and get user
import { protect } from '../middleware/authmiddleware.js'; 
// Assuming your user model is here
import User from '../model/user.js'; 

const router = express.Router();

/**
 * @desc    Validate user's subscription status from the app
 * @route   GET /api/licensing/validate
 * @access  Private (Requires user to be logged in)
 */
router.get('/validate', protect, async (req, res) => {
  try {
    // The user object (req.user) is attached by the 'protect' middleware
    const user = await User.findById(req.user.id).select('subscriptionStatus subscriptionExpiresAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Automatically expire the subscription if the date has passed
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date() && user.subscriptionStatus === 'active') {
      user.subscriptionStatus = 'expired';
      await user.save();
    }

    res.json({ status: user.subscriptionStatus, expiresAt: user.subscriptionExpiresAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error during license validation' });
  }
});

export default router;