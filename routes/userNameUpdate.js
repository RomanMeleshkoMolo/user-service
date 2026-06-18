const router = require('express').Router();
const { startOnboarding, updateName } = require('../controllers/userNameUpdateController');
const { authOnboardingOptional, authOnboardingRequired } = require('../middlewares/authOnboarding');
const { validate, schemas } = require('../middlewares/validate');

router.post('/onboarding/start', authOnboardingOptional, validate(schemas.startOnboarding), startOnboarding);

router.post('/onboarding/name', authOnboardingRequired, validate(schemas.updateName), updateName);
// router.put('/onboarding/interests', authOnboardingRequired, updateInterests);
// router.post('/onboarding/complete', authOnboardingRequired, completeOnboarding);

module.exports = router;
