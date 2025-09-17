const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');
const { uploadPhotos } = require('../middlewares/multerUpload');

const { saveUserPhoto } = require('../controllers/userRegisterPhotoController');

router.post('/onboarding/photos', authOnboardingRequired, uploadPhotos.array('photos', 30), saveUserPhoto );

module.exports = router;
