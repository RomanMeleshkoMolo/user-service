require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException (сервер продолжает работу):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection (сервер продолжает работу):', reason);
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { sanitize } = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

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

app.set('trust proxy', 1);
app.use(helmet({
  frameguard: false,
  xContentTypeOptions: false,
  referrerPolicy: false,
}));
app.use(cors({
  origin: (origin, cb) => {
    // React Native не отправляет Origin — пропускаем; веб-клиенты будут проверяться
    if (!origin) return cb(null, true);
    const allowed = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
    if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
});

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' },
}));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
