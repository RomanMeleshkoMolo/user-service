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
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const user = await User.findOne({ deviceId }).select('_id onboardingComplete').lean();

    if (!user) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const userId = String(user._id);

    const regToken = jwt.sign(
      {
        sub: userId,
        scope: user.onboardingComplete ? 'app' : 'onboarding',
        onboardingComplete: !!user.onboardingComplete,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`[refreshToken] Issued new token for user ${userId}`);

    return res.status(200).json({ regToken });
  } catch (error) {
    console.error('[refreshToken] error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
