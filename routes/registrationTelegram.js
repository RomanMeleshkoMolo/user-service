const express = require('express');
const router = express.Router();

const { registerTelegram } = require('../controllers/userRegisterTelegramController');

router.post('/api/telegramVerifyCode', registerTelegram );

module.exports = router;
