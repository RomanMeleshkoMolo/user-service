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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
