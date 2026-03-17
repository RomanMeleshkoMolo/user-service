const express = require('express');
const router = express.Router();

const { authAppRequired } = require('../middlewares/authOnboarding');
const { updateOnlineStatus } = require('../controllers/onlineStatusController');

// POST /auth/online-status - обновить онлайн-статус пользователя
router.post('/auth/online-status', authAppRequired, updateOnlineStatus);

module.exports = router;
