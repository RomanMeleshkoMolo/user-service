const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/userModel');

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many refresh attempts, please try again later.' },
});

// POST /auth/refresh
// Требует deviceId + expired JWT (для подтверждения владения токеном)
router.post('/auth/refresh', refreshLimiter, async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    // Извлекаем userId из старого токена (даже expired)
    const authHeader = req.headers.authorization || '';
    const oldToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let tokenUserId = null;
    if (oldToken) {
      try {
        const payload = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });
        tokenUserId = payload.sub || payload.userId || payload.id;
      } catch (_) {
        // Невалидная подпись — отклоняем
        return res.status(401).json({ message: 'Invalid token signature' });
      }
    }

    // Ищем пользователя по deviceId
    const user = await User.findOne({ deviceId }).select('_id onboardingComplete').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Если передан токен — проверяем что userId совпадает с deviceId owner
    if (tokenUserId && String(user._id) !== String(tokenUserId)) {
      return res.status(403).json({ message: 'Token does not match device owner' });
    }

    const userIdStr = String(user._id);

    const regToken = jwt.sign(
      {
        sub: userIdStr,
        scope: user.onboardingComplete ? 'app' : 'onboarding',
        onboardingComplete: !!user.onboardingComplete,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ regToken });
  } catch (error) {
    console.error('[refreshToken] error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
