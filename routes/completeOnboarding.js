const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');
const { completeOnboarding } = require('../controllers/completeOnboardingController');

router.post('/onboarding/complete', authOnboardingRequired, completeOnboarding);

module.exports = router;
