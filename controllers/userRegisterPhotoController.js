const mongoose = require('mongoose');
const User = require('../models/userModel');
const crypto = require('crypto');

const MAX_PHOTOS_TOTAL = 12; // реальный лимит

function isValidUserKey(userId, key) {
  // Пример: ключ должен начинаться с tmp/{userId}/...
  const expectedPrefix = `tmp/${String(userId)}/`;
  return typeof key === 'string' && key.startsWith(expectedPrefix) && !key.includes('..');
}

exports.saveUserPhoto = async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.auth?.userId || req.regUserId || req.userId;
  const { photos } = req.body || {};

  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(401).json({ message: 'Unauthorized: user id not found' });
    }
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: 'Не переданы файлы. Ожидается массив "photos"' });
    }

    const user = await User.findById(userId).select('_id photos');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentApproved = (user.photos || []).filter(p => p.status === 'approved').length;
    const available = Math.max(0, MAX_PHOTOS_TOTAL - currentApproved);
    if (photos.length > available) {
      return res.status(400).json({ message: `Лимит фото ${MAX_PHOTOS_TOTAL}. Доступно для добавления: ${available}` });
    }

    // Санитайз и валидация входящих ключей
    const now = new Date();
    const toInsert = [];
    for (const p of photos) {
      const key = p?.key || p?.filename;
      const mimeType = p?.mimeType || '';
      const size = Number(p?.size || 0);

      if (!isValidUserKey(userId, key)) {
        return res.status(400).json({ message: `Недопустимый ключ: ${key}` });
      }
      // Мягкая проверка типов на стороне сервера (детальная будет позже)
      if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(mimeType)) {
        return res.status(400).json({ message: `Недопустимый mimeType для ${key}` });
      }
      if (size <= 0 || size > 15 * 1024 * 1024) {
        return res.status(400).json({ message: `Размер файла вне допустимого диапазона для ${key}` });
      }

      toInsert.push({
        key,
        status: 'pending',
        mime: mimeType,
        bytes: size,
        createdAt: now,
        // можно вычислить и записать hash позже при фактическом чтении
      });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $push: { photos: { $each: toInsert } } },
      { new: true }
    ).select('_id photos');

    return res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('saveUserPhoto error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
