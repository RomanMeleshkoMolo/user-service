const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

const { saveUserGender } = require('../controllers/userRegisterGenderController');

router.post('/onboarding/gender', authOnboardingRequired, saveUserGender );

module.exports = router;
