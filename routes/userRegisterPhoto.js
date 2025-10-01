const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');
const { saveUserPhoto } = require('../controllers/userRegisterPhotoController');
const { validateUserPhoto } = require('../controllers/userPhotoValidationController');

// Сохранение метаданных уже загруженных фото
router.post('/onboarding/photos', authOnboardingRequired, saveUserPhoto);

// Новый эндпоинт: серверная валидация загруженного фото
router.post('/onboarding/photos/validate', authOnboardingRequired, validateUserPhoto);

module.exports = router;
