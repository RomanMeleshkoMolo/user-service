const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Connect routes
const userRegisterEmail = require('../routes/userRegisterEmail');
const userRegisterTelegram = require('../routes/userRegisterTelegram');
const setDataFromTelegram = require('../routes/setDataFromTelegram');
const userNameUpdate = require('../routes/userNameUpdate');
const userInterestTitle = require('../routes/userInterestTitle');
const userRegisterBirthday = require('../routes/userRegisterBirthday');
const userRegisterGender = require('../routes/userRegisterGender');
const userRegisterWish = require('../routes/userRegisterWish');
const userRegisterPhoto = require('../routes/userRegisterPhoto');
const storageRoutes = require('../routes/storage');
const userRegisterLocation = require('../routes/userRegisterLocation');
const userRegisterSex = require('../routes/userRegisterSex');
const userRegisterGoogle = require('../routes/userRegisterGoogle');
const checkDevice = require('../routes/checkDevice');
const onlineStatus = require('../routes/onlineStatus');
const completeOnboarding = require('../routes/completeOnboarding');
const refreshToken = require('../routes/refreshToken');

// Connect Telegram bot
const telegram = require('../telegram/telegramBot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Use routes
app.use(userRegisterEmail);
app.use(userRegisterTelegram);
app.use(setDataFromTelegram);
app.use(userNameUpdate);
app.use(userInterestTitle);
app.use(userRegisterBirthday);
app.use(userRegisterGender);
app.use(userRegisterWish);
app.use(userRegisterPhoto);
app.use(storageRoutes);
app.use(userRegisterLocation);
app.use(userRegisterSex);
app.use(userRegisterGoogle);
app.use(checkDevice);
app.use(onlineStatus);
app.use(completeOnboarding);
app.use(refreshToken);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
