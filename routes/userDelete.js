const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authOnboardingRequired } = require('../middlewares/authOnboarding');

// Удаление аккаунта пользователя
// DELETE /api/user/delete
// Требует авторизации (regToken)
router.delete('/api/user/delete', authOnboardingRequired, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - user ID not found'
      });
    }

    console.log('userDelete: удаляем пользователя с ID:', userId);

    // Находим и удаляем пользователя
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('userDelete: пользователь успешно удален:', deletedUser._id);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('userDelete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;