const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Connect routes
const registerPhone = require('../routes/registerPhone');
const registrationEmail = require('../routes/registrationEmail');
const twimlRoutes = require('../routes/twiml');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Use routes
app.use(registerPhone);
app.use(registrationEmail);
app.use('/', twimlRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
