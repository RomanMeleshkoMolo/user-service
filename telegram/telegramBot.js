const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Укажите ваш токен, полученный от BotFather
const token = process.env.TOKEN_TELEGRAM;

const url_android = process.env.URL_ANDROID;
const url_ios =  process.env.URL_IOS;

const backendUrl = `${ url_ios }/api/setDataFromTelegram` ||
                   `${ url_android }/api/setDataFromTelegram`;

// Создайте экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {

  const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const chatId = msg.chat.id;
  bot.sendMessage( chatId, 'Добро пожаловать в регистрацию Molo!');
  bot.sendMessage( chatId, 'Вот Ваш код подтверждения:)' );
  bot.sendMessage( chatId, confirmationCode );

   // Отправка кода на бэкенд
  axios.post(backendUrl, {
    chatId: chatId,
    confirmationCode: confirmationCode
  })
  .then(response => {
    console.log('Код успешно отправлен на бэкенд');
  })
  .catch(error => {
    console.error('Ошибка при отправке кода на бэкенд:', error);
  });

});
