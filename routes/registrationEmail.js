const express = require('express');
const router = express.Router();

const { registerEmail } = require('../controllers/userRegisterEmailController');

router.post('/register-email', registerEmail );

module.exports = router;
