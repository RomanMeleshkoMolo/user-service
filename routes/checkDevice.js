const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// Проверяет, есть ли пользователь с данным deviceId в базе данных
// POST /auth/check-device
// Body: { deviceId: string }
// Response: { exists: boolean, user?: { id, name, email, ... } }
router.post('/auth/check-device', async (req, res) => {
  try {
    const { deviceId } = req.body;

    console.log('checkDevice: получен deviceId', deviceId);

    if (!deviceId) {
      return res.status(400).json({
        exists: false,
        message: 'deviceId is required'
      });
    }

    // Ищем пользователя по deviceId
    const user = await User.findOne({ deviceId });

    if (user) {
      console.log('checkDevice: пользователь найден', user._id);

      // Возвращаем информацию о пользователе (без чувствительных данных)
      const userInfo = {
        id: user._id.toString(),
        name: user.name || null,
        email: user.email || null,
        hasEmail: !!user.email,
        hasTelegram: !!user.chatId,
        hasGoogle: !!user.googleId,
        onboardingComplete: !!user.onboardingComplete,
      };

      return res.status(200).json({
        exists: true,
        user: userInfo
      });
    }

    console.log('checkDevice: пользователь не найден');
    return res.status(200).json({
      exists: false
    });

  } catch (error) {
    console.error('checkDevice error:', error);
    return res.status(500).json({
      exists: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;