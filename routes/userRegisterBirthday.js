const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

const { saveUserBirthday } = require('../controllers/userRegisterBirthdayController');

router.post('/onboarding/birthday', authOnboardingRequired, saveUserBirthday );

module.exports = router;
