const twilio = require('twilio');

require('dotenv').config();

// Настройка Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


const registerPhone = async (req, res) => {
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
};


exports.registerPhone = registerPhone;
