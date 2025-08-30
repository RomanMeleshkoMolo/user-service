const router = require('express').Router();
const { startOnboarding, updateName } = require('../controllers/userNameUpdateController');
const { authOnboardingOptional, authOnboardingRequired } = require('../middlewares/authOnboarding');

// Новый пользователь без токена может сюда зайти
router.post('/onboarding/start', authOnboardingOptional, startOnboarding);

// На следующих шагах токен обязателен
router.put('/onboarding/name', authOnboardingRequired, updateName);
// router.put('/onboarding/interests', authOnboardingRequired, updateInterests);
// router.post('/onboarding/complete', authOnboardingRequired, completeOnboarding);

module.exports = router;
