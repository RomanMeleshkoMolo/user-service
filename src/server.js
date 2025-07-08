const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Connect routes
const registerPhone = require('../routes/registerPhone');
const registrationEmail = require('../routes/registrationEmail');
const registrationTelegram = require('../routes/registrationTelegram');
const setConfirmation = require('../routes/setConfirmation');
const twimlRoutes = require('../routes/twiml');

// Connect Telegram bot
const telegram = require('../telegram/telegramBot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Use routes
app.use(registerPhone);
app.use(registrationEmail);
app.use(registrationTelegram);
app.use(setConfirmation);
app.use('/', twimlRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
