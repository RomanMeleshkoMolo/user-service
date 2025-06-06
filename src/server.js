const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const transporter = require('../config/nodemailerConfig');

// Connect render Template
const renderEmailTemplate = require('./templateRenderer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

app.post('/send-confirmation', (req, res) => {

  console.log('Request body:', req.body); // Логирование тела запроса

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: '"Molo" <molo.app1@gmail.com>',
    to: email,
    subject: `Твой код: ${confirmationCode}`,
    html: renderEmailTemplate(confirmationCode)
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Error sending email roman', error });
    }

    res.status(200).json({ message: 'Confirmation code sent', code: confirmationCode });
  });
});



 // app.post('/send-confirmation', (req, res) => {
 //       console.log('Request body:', req.body);
 //       res.status(200).json({ message: 'Received111' });
 //     });


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
