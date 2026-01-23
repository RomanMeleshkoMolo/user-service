// const axios = require('axios');
// const TelegramBot = require('node-telegram-bot-api');
//
// // Укажите ваш токен, полученный от BotFather
// const token = process.env.TOKEN_TELEGRAM;
//
// const url_android = process.env.URL_ANDROID;
// const url_ios =  process.env.URL_IOS;
//
// // const backendUrl = `${ url_ios }/api/setDataFromTelegram` ||
// //                    `${ url_android }/api/setDataFromTelegram`;
//
// const url = process.env.URL_BACKEND;
//
// const backendUrl = `${ url }/api/setDataFromTelegram`;
//
//
// // Создайте экземпляр бота
// const bot = new TelegramBot(token, { polling: true });
//
// // Обработчик команды /start
// bot.onText(/\/start/, async (msg) => {
//
//   const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
//
//   const chatId = msg.chat.id;
//   bot.sendMessage( chatId, 'Добро пожаловать в регистрацию Molo!');
//   bot.sendMessage( chatId, 'Вот Ваш код подтверждения:)' );
//   bot.sendMessage( chatId, confirmationCode );
//
//    // Отправка кода на бэкенд
//   axios.post(backendUrl, {
//     chatId: chatId,
//     confirmationCode: confirmationCode
//   })
//   .then(response => {
//     console.log('Код успешно отправлен на бэкенд');
//   })
//   .catch(error => {
//     console.error('Ошибка при отправке кода на бэкенд:', error);
//   });
//
// });





// telegramBot.js
require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TOKEN_TELEGRAM;
const BACKEND_URL = process.env.URL_BACKEND; // например: "http://192.168.0.107:3000"

if (!TOKEN) {
  throw new Error('ENV TOKEN_TELEGRAM is required');
}
if (!BACKEND_URL) {
  throw new Error('ENV URL_BACKEND is required');
}

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

// Создаём бота (long polling)
const bot = new TelegramBot(TOKEN, { polling: true });

// Логируем ошибки long polling (ECONNRESET и т.п.)
bot.on('polling_error', (err) => {
  console.error('Telegram polling_error:', err?.code, err?.message);
});

bot.on('error', (err) => {
  console.error('Telegram bot error:', err?.message || err);
});

// Команда /start с опциональным deviceId
// Формат: /start или /start DEVICE_ID
// Deep link: https://t.me/MoloChatBot?start=DEVICE_ID
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const deviceId = match[1] || null; // deviceId из deep link параметра
  const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('Telegram bot /start:', { chatId, deviceId, confirmationCode });

  try {
    await bot.sendMessage(chatId, 'Добро пожаловать в регистрацию Molo!');
    await bot.sendMessage(chatId, 'Вот Ваш код подтверждения:)');
    await bot.sendMessage(chatId, confirmationCode);

    // Отправляем на бэкенд с deviceId для связки аккаунтов
    const payload = { chatId, confirmationCode };
    if (deviceId) {
      payload.deviceId = deviceId;
    }

    await api.post('/api/setDataFromTelegram', payload);

    console.log('Код успешно отправлен на бэкенд с deviceId:', deviceId);
  } catch (error) {
    console.error('Ошибка при обработке /start:', error?.message || error);
  }
});

