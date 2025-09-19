const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');

// Уже не нужно так как отправляем фото в хранилище S3
// const { uploadPhotos } = require('../middlewares/multerUpload');

const { saveUserPhoto } = require('../controllers/userRegisterPhotoController');

router.post('/onboarding/photos', authOnboardingRequired, saveUserPhoto );

module.exports = router;
