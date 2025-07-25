const express = require('express');
const router = express.Router();

const { registerPhone } = require('../controllers/userRegisterPhoneController');

router.post('/register-phone', registerPhone );

module.exports = router;
