const mongoose = require('mongoose');
const User = require('../models/userModel');

function isNonEmptyObject(data) {
  return typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length > 0;
}

async function updateUserById(userId, data) {
  if (!isNonEmptyObject(data)) return null;

  let objectId = userId;
  if (!(userId instanceof mongoose.Types.ObjectId)) {
    try {
      objectId = new mongoose.Types.ObjectId(userId);
    } catch {
      return null;
    }
  }

  return User.findByIdAndUpdate(objectId, { $set: data }, { new: true }).lean();
}

// Находим по уникальному ключу или создаем атомарно (upsert)
// ВАЖНО: deviceId используется для связки аккаунтов с разными методами регистрации
async function findOrCreateUserByUnique(unique = {}, extraOnInsert = {}) {
  const { deviceId, email, phone, chatId, googleId, ...rest } = unique;

  console.log('findOrCreateUserByUnique: входные данные', { deviceId, email, phone, chatId, googleId });

  // ШАГ 1: Если есть deviceId - сначала ищем по нему
  if (deviceId) {
    try {
      const userByDevice = await User.findOne({ deviceId });
      if (userByDevice) {
        console.log('findOrCreateUserByUnique: найден пользователь по deviceId', userByDevice._id);

        // Обновляем пользователя новыми данными (связываем аккаунты)
        const updateData = {};
        if (email && !userByDevice.email) updateData.email = email;
        if (chatId && !userByDevice.chatId) updateData.chatId = chatId;
        if (googleId && !userByDevice.googleId) updateData.googleId = googleId;
        if (phone && !userByDevice.phone) updateData.phone = phone;

        if (Object.keys(updateData).length > 0) {
          console.log('findOrCreateUserByUnique: связываем аккаунт, добавляем:', updateData);
          Object.assign(userByDevice, updateData);
          await userByDevice.save();
        }

        return userByDevice;
      }
    } catch (err) {
      console.warn('findOrCreateUserByUnique: ошибка поиска по deviceId', err.message);
    }
  }

  // ШАГ 2: Формируем query для поиска по другим идентификаторам
  const query = {};
  if (email) query.email = email;
  if (phone) query.phone = phone;
  if (chatId) query.chatId = chatId;
  if (googleId) query.googleId = googleId;

  // Если нет ни одного идентификатора — не создаём пустых записей
  if (Object.keys(query).length === 0) {
    throw new Error('NO_UNIQUE_IDENTIFIER');
  }

  // Данные для создания нового пользователя
  const insertData = {
    onboardingComplete: false,
    ...query,
    ...rest,
    ...extraOnInsert,
  };
  // Добавляем deviceId только если он есть
  if (deviceId) insertData.deviceId = deviceId;

  const update = {
    $setOnInsert: insertData,
  };

  try {
    const doc = await User.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    console.log('findOrCreateUserByUnique: результат', { userId: doc?._id, deviceId: doc?.deviceId });
    return doc;
  } catch (e) {
    // Гонка/дубликат: E11000 — повторим без upsert и вернем найденного
    if (e && e.code === 11000) {
      console.log('findOrCreateUserByUnique: дубликат, ищем существующего');
      return User.findOne(query);
    }
    throw e;
  }
}


module.exports = {
  // онбординг
  updateUserById,
  findOrCreateUserByUnique,
};
