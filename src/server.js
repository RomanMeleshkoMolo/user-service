const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Connect routes
const userRegisterPhone = require('../routes/userRegisterPhone');
const userRegisterEmail = require('../routes/userRegisterEmail');
const userRegisterTelegram = require('../routes/userRegisterTelegram');
const setDataFromTelegram = require('../routes/setDataFromTelegram');
const userNameUpdate = require('../routes/userNameUpdate');
const twimlRoutes = require('../routes/twiml');
const userInterestTitle = require('../routes/userInterestTitle');
const userRegisterBirthday = require('../routes/userRegisterBirthday');
const userRegisterGender = require('../routes/userRegisterGender');
const userRegisterWish = require('../routes/userRegisterWish');
const userRegisterPhoto = require('../routes/userRegisterPhoto');

// Connect Telegram bot
const telegram = require('../telegram/telegramBot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Use routes
app.use(userRegisterPhone);
app.use(userRegisterEmail);
app.use(userRegisterTelegram);
app.use(setDataFromTelegram);
app.use(userNameUpdate);
app.use('/', twimlRoutes);
app.use(userInterestTitle);
app.use(userRegisterBirthday);
app.use(userRegisterGender);
app.use(userRegisterWish);
app.use(userRegisterPhoto);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
