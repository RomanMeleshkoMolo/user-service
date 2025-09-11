const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

const { saveUserWish } = require('../controllers/userRegisterWishController');

router.post('/onboarding/wish', authOnboardingRequired, saveUserWish );

module.exports = router;
