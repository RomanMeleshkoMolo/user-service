const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

const { saveUserInterest } = require('../controllers/userInterestTitleController');

router.post('/onboarding/interest', authOnboardingRequired, saveUserInterest );

module.exports = router;
