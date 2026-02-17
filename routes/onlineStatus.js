const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');
const { updateOnlineStatus } = require('../controllers/onlineStatusController');

// POST /auth/online-status - обновить онлайн-статус пользователя
router.post('/auth/online-status', authOnboardingRequired, updateOnlineStatus);

module.exports = router;
