const express = require('express');
const router = express.Router();

const authOnboarding = require('../middlewares/authOnboarding');
const { emailCodeLimiter } = require('../middlewares/rateLimiter');
const { authOnboardingOptional } = require('../middlewares/authOnboarding');


const { registerEmail } = require('../controllers/userRegisterEmailController');
const { validate, schemas } = require('../middlewares/validate');

router.post('/register-email', emailCodeLimiter, validate(schemas.registerEmail), registerEmail );

module.exports = router;
