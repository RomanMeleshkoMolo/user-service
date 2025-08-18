const twilio = require('twilio');

require('dotenv').config();

// Настройка Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const { createUser, updateUser} = require('../services/userService');
const User = require("../models/userModel");


const registerPhone = async (req, res) => {
  const data = { phone } = req.body;
  data.phoneTwilio = '+13187502771';

  console.log("номер который прилетает из клиента - " + data.phone);

  const confirmationCode = Math.floor(100000 + Math.random() * 900000);

  if (!data.phone) {
    return res.status(400).json({ success: false, message: 'Номер телефона обязателен' });
  }

  try {
    // Создаем звонок
    const call = await client.calls.create({
      to: data.phone,
      from: data.phoneTwilio, // ваш номер, зарегистрированный в Twilio, без пробелов
      url: `https://10.0.2.2:3000/twiml/confirmation?code=${confirmationCode}`,
    });

    const existingUser = await User.findOne({ phone: data.phone });

    if ( !existingUser ) {

        const user = await createUser( data );
        res.status(200).send( user );

    } else {

        const user = await updateUser( data );
        res.status(201).send( user );

    }

  } catch (error) {
    console.error('Ошибка при вызове:', error);
    res.status(500).json({ success: false, message: 'Ошибка при вызове' });
  }
};


exports.registerPhone = registerPhone;
