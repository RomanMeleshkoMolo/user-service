// routes/twiml.js
const express = require('express');
const router = express.Router();

router.get('/confirmation', (req, res) => {
  const code = req.query.code || '...'; // Получаем код из URL
  const response = `
    <Response>
      <Say voice="alice">Ваш код подтверждения: ${code}</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(response);
});

module.exports = router;
