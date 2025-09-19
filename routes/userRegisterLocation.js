const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

const { saveUserLocation } = require('../controllers/userRegisterLocationController');

router.post('/onboarding/location', authOnboardingRequired, saveUserLocation );

module.exports = router;
