const express = require('express');
const router = express.Router();

const { authOnboardingRequired, authAppRequired } = require('../middlewares/authOnboarding');
const { saveUserPhoto } = require('../controllers/userRegisterPhotoController');
const { validateUserPhoto } = require('../controllers/userPhotoValidationController');

// Сохранение метаданных уже загруженных фото
router.post('/onboarding/photos', authOnboardingRequired, saveUserPhoto);

// Валидация фото — принимает и onboarding и app токены
router.post('/onboarding/photos/validate', authAppRequired, validateUserPhoto);

module.exports = router;
