const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { findOrCreateUserByUnique, updateUserById } = require('../services/userService');

router.post('/api/setDataFromTelegram', async (req, res) => {
  const { chatId, confirmationCode, deviceId } = req.body;

  console.log('setDataFromTelegram: получены данные', { chatId, confirmationCode, deviceId });

  try {
    if (!chatId || !confirmationCode) {
      return res.status(400).json({
        success: false,
        message: 'chatId и confirmationCode обязательны'
      });
    }

    let user = null;

    // ШАГ 1: Ищем по deviceId (ГЛАВНЫЙ идентификатор для связки аккаунтов)
    // deviceId приходит из deep link: https://t.me/MoloChatBot?start=DEVICE_ID
    if (deviceId) {
      user = await User.findOne({ deviceId });
      if (user) {
        console.log('setDataFromTelegram: найден пользователь по deviceId', user._id);
        // Связываем Telegram с существующим аккаунтом
        user.chatId = chatId;
        user.confirmationCode = confirmationCode;
        await user.save();
        return res.status(200).json({
          success: true,
          message: 'Telegram привязан к существующему пользователю по deviceId',
          userId: user._id,
          user: user
        });
      }
    }

    // ШАГ 2: Ищем по chatId (повторная регистрация через Telegram)
    user = await User.findOne({ chatId });
    if (user) {
      console.log('setDataFromTelegram: найден пользователь по chatId', user._id);
      user.confirmationCode = confirmationCode;
      // Если deviceId передан - сохраняем его тоже
      if (deviceId && !user.deviceId) {
        user.deviceId = deviceId;
      }
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Пользователь обновлен',
        userId: user._id,
        user: user
      });
    }

    // ШАГ 3: Создаем нового пользователя
    console.log('setDataFromTelegram: пользователь не найден, создаем нового');

    const newUserData = {
      chatId,
      confirmationCode,
    };
    if (deviceId) {
      newUserData.deviceId = deviceId;
    }

    user = await User.create(newUserData);

    return res.status(200).json({
      success: true,
      message: 'Новый пользователь создан',
      userId: user._id,
      user: user
    });

  } catch (error) {
    console.error('setDataFromTelegram: ошибка при обновлении базы данных:', error);

    // Обработка ошибки дубликата (если chatId уже существует у другого пользователя)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: `Пользователь с таким ${field} уже существует`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
