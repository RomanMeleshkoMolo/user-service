const mongoose = require('mongoose');
const User = require('../models/userModel');

const ALLOWED_GENDERS = ['male', 'female', 'other'];

exports.saveUserGender = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.auth?.userId ||
      req.regUserId ||
      req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ message: 'Unauthorized: user id not found in request context' });
    }

     const payload = req.body && req.body.payload ? req.body.payload : {};
    const { gender } = payload;

    if (!gender || typeof gender !== 'string') {
      return res.status(400).json({ message: 'Поле gender обязательно' });
    }

    const normalizedGender = gender.trim().toLowerCase();
    if (!ALLOWED_GENDERS.includes(normalizedGender)) {
      return res.status(400).json({
        message: 'Недопустимое значение gender',
        allowed: ALLOWED_GENDERS,
      });
    }

    const update = { $set: { gender: normalizedGender } };

    const updated = await User.findByIdAndUpdate(
      userId,
      update,
      {
        new: true,            // вернуть обновленный документ
        runValidators: true,  // запустить валидаторы схемы
      }
    ).select('-password -refreshToken -tokens -salt -__v'); // убираем чувствительные поля

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ ok: true, user: updated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error' });
    }
    // Если в схеме нет поля gender, strict-схема может бросить ошибку
    // Подсказка пользователю
    if (error?.name === 'StrictModeError') {
      return res.status(400).json({
        message: 'Поле gender отсутствует в схеме User. Добавьте его в модель или отключите strict для этого поля.',
      });
    }

    console.error('saveUserGender error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
