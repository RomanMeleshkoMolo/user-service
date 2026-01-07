const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { findOrCreateUserByUnique, updateUserById } = require('../services/userService');

router.post('/api/setDataFromTelegram', async (req, res) => {
  const { chatId, confirmationCode, email, googleId } = req.body;

  console.log('setDataFromTelegram: получены данные', { chatId, confirmationCode, email, googleId });

  try {
    if (!chatId || !confirmationCode) {
      return res.status(400).json({
        success: false,
        message: 'chatId и confirmationCode обязательны'
      });
    }

    let user = null;

    // ШАГ 1: Ищем пользователя по chatId (если уже был зарегистрирован через Telegram)
    if (chatId) {
      user = await User.findOne({ chatId });
      if (user) {
        console.log('setDataFromTelegram: найден пользователь по chatId', user._id);
        // Обновляем confirmationCode
        user.confirmationCode = confirmationCode;
        await user.save();
        return res.status(200).json({
          success: true,
          message: 'Пользователь обновлен',
          userId: user._id,
          user: user
        });
      }
    }

    // ШАГ 2: Если не найден по chatId, ищем по email (если передан)
    // Это нужно для случая, когда пользователь сначала зарегистрировался через email,
    // а потом решил привязать Telegram
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        console.log('setDataFromTelegram: найден пользователь по email', user._id);
        // Добавляем chatId и обновляем confirmationCode к существующему пользователю
        user.chatId = chatId;
        user.confirmationCode = confirmationCode;
        await user.save();
        return res.status(200).json({
          success: true,
          message: 'Telegram привязан к существующему пользователю',
          userId: user._id,
          user: user
        });
      }
    }

    // ШАГ 3: Если не найден по email, ищем по googleId (если передан)
    // Это нужно для случая, когда пользователь сначала зарегистрировался через Google,
    // а потом решил привязать Telegram
    if (googleId) {
      user = await User.findOne({ googleId });
      if (user) {
        console.log('setDataFromTelegram: найден пользователь по googleId', user._id);
        // Добавляем chatId и обновляем confirmationCode к существующему пользователю
        user.chatId = chatId;
        user.confirmationCode = confirmationCode;
        await user.save();
        return res.status(200).json({
          success: true,
          message: 'Telegram привязан к существующему пользователю',
          userId: user._id,
          user: user
        });
      }
    }

    // ШАГ 4: Если не нашли ни по одному полю - создаем нового пользователя
    // Используем findOrCreateUserByUnique для единообразия с Google/Email логикой
    console.log('setDataFromTelegram: пользователь не найден, создаем нового');

    // Подготавливаем данные для создания
    const userData = {
      chatId,
      confirmationCode,
    };

    // Если есть email или googleId - передаем их тоже (для единообразия)
    if (email) {
      userData.email = email.toLowerCase().trim();
    }
    if (googleId) {
      userData.googleId = googleId;
    }

    // Используем findOrCreateUserByUnique - он должен создать пользователя,
    // если не найдет по уникальным полям (chatId, email, googleId)
    user = await findOrCreateUserByUnique(userData);

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
