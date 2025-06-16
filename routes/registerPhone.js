const express = require('express');
const router = express.Router();
const twilio = require('twilio');

require('dotenv').config();

// Настройка Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

router.post('/register-phone', async (req, res) => {
  const { phone } = req.body;

  console.log( "номер который прилетает из клиента - " + phone );

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Номер телефона обязателен' });
  }

  try {
    // Отправка SMS с кодом подтверждения
    const message = await client.messages.create({
      body: 'Ваш код подтверждения: 123456',
      from: '+1 318 750 2771',
      to: phone,
    });

    res.json({ success: true, message: 'Код отправлен' });
  } catch (error) {
    console.error('Ошибка отправки SMS:', error);
    res.status(500).json({ success: false, message: 'Ошибка отправки SMS' });
  }

});

module.exports = router;
