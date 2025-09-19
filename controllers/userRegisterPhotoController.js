const mongoose = require('mongoose');
const User = require('../models/userModel');

const MAX_PHOTOS_TOTAL = 1000;

exports.saveUserPhoto = async (req, res) => {
  // Определяем userId из контекста авторизации
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.auth?.userId ||
    req.regUserId ||
    req.userId;

  // Новый поток: клиент отправляет метаданные после загрузки в S3
  // Ожидаем: { photos: [{ key, filename, mimeType, size }] }
  const { photos } = req.body || {};

  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ message: 'Unauthorized: user id not found in request context' });
    }

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: 'Не переданы файлы. Ожидается массив "photos"' });
    }

    // Валидация типов по mimeType если нужно
    // Доступ к ALLOWED_MIME можно вернуть из константы, но мы здесь храним только key/filename/mimeType/size

    // Ограничение по количеству фото у пользователя
    // Предполагаем, что в БД у User есть поле userPhoto: [String] (URL или ключи)
    const user = await User.findById(userId).select('_id userPhoto');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentCount = Array.isArray(user.userPhoto) ? user.userPhoto.length : 0;
    // Разрешаем добавить максимум MAX_PHOTOS_TOTAL
    const available = Math.max(0, MAX_PHOTOS_TOTAL - currentCount);
    if (photos.length > available) {
      return res.status(400).json({
        message: `Можно иметь максимум ${MAX_PHOTOS_TOTAL} фото. Сейчас: ${currentCount}. Можно добавить еще: ${available}.`
      });
    }

    // Формируем строки URL/ключи для сохранения в БД
    // Вы можете хранить или ключи S3, или публичные URL. Здесь сохраняем ключи (key) как URL-образ.
    // Если хотите сохранить публичные URL, можно построить их здесь. Ниже сохраняем ключи в виде путей S3.
    const urls = photos.map(p => p.key || p.filename);

    // Обновим пользователя: добавим новые URL'ы в массив userPhoto
    const updated = await User.findByIdAndUpdate(
      userId,
      { $push: { userPhoto: { $each: urls } } },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ ok: true, user: updated });
  } catch (error) {
    console.error('saveUserPhoto error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

