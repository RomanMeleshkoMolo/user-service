const mongoose = require('mongoose');
const User = require('../models/userModel');

/**
 * Обновить онлайн-статус пользователя
 * POST /auth/online-status
 * Body: { isOnline: boolean }
 */
exports.updateOnlineStatus = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.auth?.userId ||
      req.regUserId ||
      req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ message: 'Unauthorized: user id not found' });
    }

    const { isOnline } = req.body;

    const update = {
      isOnline: !!isOnline,
      lastSeen: new Date(),
    };

    await User.findByIdAndUpdate(userId, update);

    console.log(`[onlineStatus] user ${userId} is now ${isOnline ? 'online' : 'offline'}`);

    return res.status(200).json({ success: true, isOnline: !!isOnline });
  } catch (error) {
    console.error('[onlineStatus] error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
