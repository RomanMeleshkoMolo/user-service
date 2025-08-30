const express = require('express');
const router = express.Router();

const authOnboarding = require('../middlewares/authOnboarding');
// const { emailCodeLimiter } = require('../middlewares/rateLimiter');
const { authOnboardingOptional } = require('../middlewares/authOnboarding');


const { registerEmail } = require('../controllers/userRegisterEmailController');

router.post('/register-email', authOnboardingOptional, registerEmail );

module.exports = router;
