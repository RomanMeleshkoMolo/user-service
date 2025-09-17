// controllers/userRegisterPhotoController.js
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const User = require('../models/userModel');

const MAX_PHOTOS_TOTAL = 1000;
const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

// Безопасное удаление файла
async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // игнорируем
  }
}

// Построение публичного URL.
// Ожидается, что файлы лежат в uploads/user-photos/:userId/:filename
function buildPublicUrl(req, userId, filename) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/user-photos/${userId}/${filename}`;
}

exports.saveUserPhoto = async (req, res) => {

  // Определяем userId из контекста авторизации
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.auth?.userId ||
    req.regUserId ||
    req.userId;

  // Соберём файлы из Multer: поддержим и один файл, и массив
  const files = Array.isArray(req.files)
    ? req.files
    : req.file
      ? [req.file]
      : [];

  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      // если файлы уже легли на диск — удалим
      await Promise.all(files.map(f => safeUnlink(f.path)));
      return res.status(401).json({ message: 'Unauthorized: user id not found in request context' });
    }

    if (!files.length) {
      return res.status(400).json({ message: 'Не переданы файлы. Используйте поле "photos" (или "photo") в multipart/form-data.' });
    }

    // Валидация типов
    const badType = files.find(f => !ALLOWED_MIME.includes(f.mimetype));
    if (badType) {
      await Promise.all(files.map(f => safeUnlink(f.path)));
      return res.status(400).json({ message: `Недопустимый тип файла: ${badType.originalname || badType.filename || 'unknown'}` });
    }

    // Найдем пользователя, чтобы знать текущее количество фото
    const user = await User.findById(userId).select('_id userPhoto');
    if (!user) {
      await Promise.all(files.map(f => safeUnlink(f.path)));
      return res.status(404).json({ message: 'User not found' });
    }

    const currentCount = Array.isArray(user.userPhoto) ? user.userPhoto.length : 0;
    const available = Math.max(0, MAX_PHOTOS_TOTAL - currentCount);

    if (files.length > available) {
      await Promise.all(files.map(f => safeUnlink(f.path)));
      return res.status(400).json({
        message: `Можно иметь максимум2 ${MAX_PHOTOS_TOTAL} фото. Сейчас: ${currentCount}. Можно добавить еще: ${available}.`
      });
    }

    // Сформируем URL'ы для сохранения в БД
    const urls = files.map(f => {
      // Если ваше размещение отличается, поменяйте логику здесь
      return buildPublicUrl(req, userId, f.filename);
    });

    // Обновим пользователя: добавим новые URL'ы в массив userPhoto
    const updated = await User.findByIdAndUpdate(
      userId,
      { $push: { userPhoto: { $each: urls } } },
      { new: true, runValidators: true }
    ).select('-__v'); // по желанию, исключите поля

    if (!updated) {
      // крайне маловероятно, но на всякий случай удалим файлы
      await Promise.all(files.map(f => safeUnlink(f.path)));
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ ok: true, user: updated });
  } catch (error) {
    // В случае любой ошибки — удалим уже загруженные файлы
    await Promise.all(files.map(f => safeUnlink(f.path)));

    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Файл превышает максимально допустимый размер (5 МБ)' });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error' });
    }

    console.error('saveUserPhoto error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
