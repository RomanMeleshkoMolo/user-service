const jwt = require('jsonwebtoken');
const { findOrCreateUserByUnique, updateUserById} = require('../services/userService');

exports.startOnboarding = async (req, res) => {
  try {
    const { provider, email, googleId, chatId } = req.body || {};

    if (!provider) {
      return res.status(400).json({ message: 'provider required' });
    }

    // формируем unique-поле в зависимости от provider
    let unique = null;

    if (provider === 'email') {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) return res.status(400).json({ message: 'identifier required' });
      unique = { email: normalizedEmail };
    } else if (provider === 'google') {
      const id = (googleId || '').trim();
      if (!id) return res.status(400).json({ message: 'identifier required' });
      unique = { googleId: id };
    } else if (provider === 'telegram') {
      const id = String(chatId ?? '').trim();
      if (!id) return res.status(400).json({ message: 'identifier required' });
      unique = { chatId: id };
    } else {
      return res.status(400).json({ message: 'unsupported provider' });
    }

    // создать или найти юзера по уникальному идентификатору
    const user = await findOrCreateUserByUnique(unique);

    const userId = user._id?.toString?.() || user.id;

    const regToken = jwt.sign(
      { sub: String(userId), scope: 'onboarding', onboardingComplete: false, provider },
      process.env.JWT_SECRET,
      { expiresIn: '3d' } // можешь поменять на '30m' если нужно как в примере
    );

    const u = user.toObject ? user.toObject() : user;
    const normalizedUser = { ...u, id: String(userId) };
    delete normalizedUser._id;

    return res.status(201).json({ regToken, user: normalizedUser });
  } catch (e) {
    if (e.message === 'NO_UNIQUE_IDENTIFIER') {
      return res.status(400).json({ message: 'identifier required' });
    }
    console.error('startOnboarding error:', e);
    return res.status(500).json({ message: 'Failed to start onboarding' });
  }
};


exports.updateName = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name } = req.body;

    console.log("====name=====");
    console.log( name );

    const normalizedName = (name || '').trim();
    if (normalizedName.length < 2 || normalizedName.length > 50) {
      return res.status(400).json({ message: 'Name length must be between 2 and 50 characters' });
    }

    const updatedUser = await updateUserById(userId, { name: normalizedName });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Name updated successfully', user: updatedUser });
  } catch (error) {
    console.error('updateName error:', error);
    res.status(500).json({ message: 'Error updating user name' });
  }
};
