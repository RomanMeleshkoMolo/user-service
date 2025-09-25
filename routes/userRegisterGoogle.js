const router = require('express').Router();
const { authOnboardingOptional } = require('../middlewares/authOnboarding');
const { userRegisterGoogle } = require('../controllers/userRegisterGoogleController');

router.post('/auth/google', authOnboardingOptional, userRegisterGoogle);

module.exports = router;
