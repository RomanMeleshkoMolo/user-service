const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { findOrCreateUserByUnique, updateUserById } = require('../services/userService');
const User = require('../models/userModel');

const GOOGLE_CLIENT_ID = process.env.WEB_CLIENT_ID; // тот же, что на клиенте
const jwtSecret = process.env.JWT_SECRET;

if (!GOOGLE_CLIENT_ID) {
  console.warn('[userRegisterGoogle] Missing WEB_CLIENT_ID in env');
}
if (!jwtSecret) {
  console.warn('[userRegisterGoogle] Missing JWT_SECRET in env');
}

const oAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.userRegisterGoogle = async (req, res) => {
  try {
    const { idToken, deviceId } = req.body || {};

    console.log('userRegisterGoogle: получены данные', { idToken: !!idToken, deviceId });

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    // Верификация Google ID Token
    const ticket = await oAuthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID, // Проверка aud
    });
    const payload = ticket.getPayload(); // https://developers.google.com/identity/openid-connect/openid-connect#an-id-tokens-payload
    // Полезные поля:
    // sub — уникальный Google ID пользователя
    // email — email пользователя
    // email_verified — boolean
    // name, picture — имя и аватар

    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const emailVerified = !!payload.email_verified;
    const name = payload.name || '';
    const picture = payload.picture || '';

    if (!googleId) {
      return res.status(401).json({ message: 'Invalid Google token (no sub)' });
    }

    // По вашему процессу онбординга — email желателен, но иногда его может не быть (редко).
    // Если email отсутствует или не верифицирован — решаем бизнес-правило:
    if (!email || !emailVerified) {
      return res.status(400).json({ message: 'Google email is missing or not verified' });
    }

    let user = null;

    // ШАГ 1: Ищем по deviceId (ГЛАВНЫЙ идентификатор для связки аккаунтов)
    if (deviceId) {
      user = await User.findOne({ deviceId });
      if (user) {
        console.log('userRegisterGoogle: найден пользователь по deviceId', user._id);

        // Проверяем, не занят ли email другим пользователем
        const existingByEmail = await User.findOne({ email });
        if (existingByEmail && existingByEmail._id.toString() !== user._id.toString()) {
          return res.status(409).json({ message: 'This email is already in use by another user' });
        }

        // Связываем Google аккаунт с существующим пользователем
        user.email = email;
        user.googleId = googleId;
        user.isEmailVerified = emailVerified;
        if (!user.name && name) user.name = name;
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      }
    }

    // ШАГ 2: Если не нашли по deviceId, используем стандартную логику
    if (!user) {
      const uniqueData = { email, googleId };
      if (deviceId) uniqueData.deviceId = deviceId;
      user = await findOrCreateUserByUnique(uniqueData);
    }

    const userId = user._id?.toString?.() || user.id;

    // Дополним профиль данными из Google (безопасное обновление)
    const patch = {};
    if (name && !user.name) patch.name = name;
    if (picture && !user.avatarUrl) patch.avatarUrl = picture;
    if (!user.googleId) patch.googleId = googleId;
    if (!user.isEmailVerified && emailVerified) patch.isEmailVerified = true;
    if (deviceId && !user.deviceId) patch.deviceId = deviceId;

    if (Object.keys(patch).length > 0) {
      try {
        await updateUserById(userId, patch);
      } catch (e) {
        console.warn('[userRegisterGoogle] updateUserById failed:', e.message);
        // не фейлим весь процесс, продолжаем
      }
    }

    // Выдаём onboarding-токен (как в вашем startOnboarding)
    const onboardingComplete = !!user.onboardingComplete;
    const regToken = jwt.sign(
      { sub: userId, scope: 'onboarding', onboardingComplete },
      jwtSecret,
      { expiresIn: '3d' }
    );

    // Нормализуем пользователя для ответа
    const u = user.toObject ? user.toObject() : user;
    const normalizedUser = { ...u, id: userId };
    delete normalizedUser._id;

    return res.status(200).json({ regToken, user: normalizedUser });
  } catch (e) {
    console.error('[userRegisterGoogle] error:', e?.message || e);
    return res.status(500).json({ message: 'Failed to register via Google' });
  }
};

