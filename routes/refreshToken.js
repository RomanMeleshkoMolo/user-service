const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// POST /auth/refresh
// Body: { deviceId }
// Находит пользователя по deviceId и выдаёт новый JWT.
// Не требует авторизации — используется когда текущий токен истёк.
router.post('/auth/refresh', async (req, res) => {
  try {
    const { deviceId, userId } = req.body;
    console.log('[refreshToken] incoming:', { deviceId, userId });

    if (!deviceId && !userId) {
      return res.status(400).json({ message: 'deviceId or userId is required' });
    }

    let user = null;

    if (deviceId) {
      user = await User.findOne({ deviceId }).select('_id onboardingComplete').lean();
    }

    // Fallback: ищем по userId из истёкшего JWT
    if (!user && userId) {
      user = await User.findById(userId).select('_id onboardingComplete').lean();
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userIdStr = String(user._id);

    const regToken = jwt.sign(
      {
        sub: userIdStr,
        scope: user.onboardingComplete ? 'app' : 'onboarding',
        onboardingComplete: !!user.onboardingComplete,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`[refreshToken] Issued new token for user ${userIdStr}`);

    return res.status(200).json({ regToken });
  } catch (error) {
    console.error('[refreshToken] error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
