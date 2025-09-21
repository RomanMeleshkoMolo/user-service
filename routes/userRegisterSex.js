const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

const { saveUserSex } = require('../controllers/userRegisterSexController');

router.post('/onboarding/my-orientation', authOnboardingRequired, saveUserSex );

module.exports = router;
