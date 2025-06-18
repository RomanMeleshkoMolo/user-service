// const express = require('express');
// const router = express.Router();
// const twilio = require('twilio');
//
// require('dotenv').config();
//
// // Setting Twilio
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);
//
// router.post('/register-phone', async (req, res) => {
//   const { phone } = req.body;
//
//   console.log( "номер который прилетает из клиента - " + phone );
//
//   const confirmationCode = Math.floor(100000 + Math.random() * 900000);
//
//   if (!phone) {
//     return res.status(400).json({ success: false, message: 'Номер телефона обязателен' });
//   }
//
//   try {
//     // Send SMS with code
//     const message = await client.messages.create({
//       body: `Ваш код подтверждения: ${confirmationCode}`,
//       from: '+1 318 750 2771',
//       to: phone,
//     });
//
//
//     // Sent to client some data
//     res.json({ success: true, message: 'Код отправлен', code: confirmationCode });
//   } catch (error) {
//     console.error('Ошибка отправки SMS:', error);
//     res.status(500).json({ success: false, message: 'Ошибка отправки SMS' });
//   }
//
// });
//
// module.exports = router;




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
  const phoneTwilio = '+13187502771';

  console.log("номер который прилетает из клиента - " + phone);

  const confirmationCode = Math.floor(100000 + Math.random() * 900000);

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Номер телефона обязателен' });
  }

  try {
    // Создаем звонок
    const call = await client.calls.create({
      to: phone,
      from: phoneTwilio, // ваш номер, зарегистрированный в Twilio, без пробелов
      url: `https://10.0.2.2:3000/twiml/confirmation?code=${confirmationCode}`,
    });

    // Отправляем ответ клиенту
    res.json({
      success: true,
      message: 'Звонок инициирован',
      code: confirmationCode,
      phoneTwilio: phoneTwilio
    });
  } catch (error) {
    console.error('Ошибка при вызове:', error);
    res.status(500).json({ success: false, message: 'Ошибка при вызове' });
  }
});

module.exports = router;




// const express = require('express');
// const router = express.Router();
// const { Vonage } = require('@vonage/server-sdk');
//
// require('dotenv').config();
//
// // Инициализация Nexmo (Vonage)
// const vonage = new Vonage({
//   apiKey: process.env.VONAGE_API_KEY,
//   apiSecret: process.env.VONAGE_API_SECRET,
// });
//
// router.post('/register-phone', async (req, res) => {
//   const { phone } = req.body;
//
//   console.log("номер который прилетает из клиента - " + phone);
//
//   const confirmationCode = Math.floor(100000 + Math.random() * 900000);
//
//   if (!phone) {
//     return res.status(400).json({ success: false, message: 'Номер телефона обязателен' });
//   }
//
//   try {
//     // Отправляем SMS через Nexmo
//     await new Promise((resolve, reject) => {
//       vonage.sms.send({
//         to: phone,
//         from: 'Molo', // Или ваш зарегистрированный номер или имя отправителя
//         text: `Ваш код подтверждения: ${confirmationCode}`,
//       }, (err, responseData) => {
//         if (err) {
//           console.error('Ошибка отправки SMS:', err);
//           reject(err);
//         } else {
//           if (responseData.messages[0].status === "0") {
//             console.log("Сообщение успешно отправлено.");
//             resolve();
//           } else {
//             console.error('Ошибка ответа от Nexmo:', responseData.messages[0]['error-text']);
//             reject(new Error(responseData.messages[0]['error-text']));
//           }
//         }
//       });
//     });
//
//     // Успешная отправка
//     res.json({ success: true, message: 'Код отправлен', code: confirmationCode });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Ошибка отправки SMS' });
//   }
// });
//
// module.exports = router;

