const express = require('express');
const router = express.Router();

const { registerPhone: userRegisterPhone } = require('../controllers/userRegisterPhoneController');

router.post('/register-phone', userRegisterPhone );

module.exports = router;
