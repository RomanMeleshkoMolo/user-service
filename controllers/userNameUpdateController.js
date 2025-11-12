const jwt = require('jsonwebtoken');
const { findOrCreateUserByUnique, updateUserById } = require('../services/userService');

exports.startOnboarding = async (req, res) => {
  try {
    const { email } = req.body || {};

    console.log( "email:" + email )

    if ( !email ) {
      return res.status(400).json({ message: 'Identifier required (email, phone or chatId)' });
    }

    const user = await findOrCreateUserByUnique({ email });
    const userId = user._id?.toString?.() || user.id;

    const regToken = jwt.sign(
      { sub: userId, scope: 'onboarding', onboardingComplete: false },
      process.env.JWT_SECRET,
      { expiresIn: '3d' }
    );

    const u = user.toObject ? user.toObject() : user;
    const normalizedUser = { ...u, id: userId };
    delete normalizedUser._id;

    res.status(201).json({ regToken, user: normalizedUser });
  } catch (e) {
    if (e.message === 'NO_UNIQUE_IDENTIFIER') {
      return res.status(400).json({ message: 'Identifier required (email, phone or chatId)' });
    }
    console.error('startOnboarding error:', e);
    res.status(500).json({ message: 'Failed to start onboarding' });
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
