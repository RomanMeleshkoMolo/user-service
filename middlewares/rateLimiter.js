// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

const emailCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,           // 10 минут
  max: 5,                              // не более 5 попыток на окно
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

module.exports = { emailCodeLimiter };
