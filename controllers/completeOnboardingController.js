const mongoose = require('mongoose');
const User = require('../models/userModel');

exports.completeOnboarding = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.auth?.userId ||
      req.regUserId ||
      req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { onboardingComplete: true } },
      { new: true }
    ).select('_id onboardingComplete').lean();

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[onboarding] User ${userId} completed onboarding`);

    return res.json({ ok: true });
  } catch (err) {
    console.error('completeOnboarding error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
