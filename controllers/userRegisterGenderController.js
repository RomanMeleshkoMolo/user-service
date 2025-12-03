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
      return res
        .status(401)
        .json({ message: 'Unauthorized: user id not found in request context' });
    }

    const payload = req.body && req.body.payload ? req.body.payload : {};
    const { gender } = payload;

    console.log('=====gender====');
    console.log(gender);

    // ожидаем объект
    if (!gender || typeof gender !== 'object') {
      return res
        .status(400)
        .json({ message: 'Поле gender обязательно и должно быть объектом' });
    }

    const { id, title } = gender;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Поле gender.id обязательно' });
    }

    const normalizedId = id.trim().toLowerCase();
    if (!ALLOWED_GENDERS.includes(normalizedId)) {
      return res.status(400).json({
        message: 'Недопустимое значение gender.id',
        allowed: ALLOWED_GENDERS,
      });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Поле gender.title обязательно' });
    }

    const update = {
      $set: {
        gender: {
          id: normalizedId,
          title: title.trim(),
          // icon можно сохранить если есть, но в БД пока не обязательно
        },
      },
    };

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken -tokens -salt -__v');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ ok: true, user: updated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error' });
    }

    if (error?.name === 'StrictModeError') {
      return res.status(400).json({
        message:
          'Поле gender отсутствует в схеме User. Добавьте его в модель или отключите strict для этого поля.',
      });
    }

    console.error('saveUserGender error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
