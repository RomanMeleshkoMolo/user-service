// const express = require('express');
// const router = express.Router();
//
// const { authOnboardingRequired } = require('../middlewares/authOnboarding');
//
// // Уже не нужно так как отправляем фото в хранилище S3
// // const { uploadPhotos } = require('../middlewares/multerUpload');
//
// const { saveUserPhoto } = require('../controllers/userRegisterPhotoController');
//
// router.post('/onboarding/photos', authOnboardingRequired, saveUserPhoto );
//
// module.exports = router;


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
