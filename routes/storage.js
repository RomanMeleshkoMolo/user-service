const express = require('express');
const router = express.Router();

const { authOnboardingRequired } = require('../middlewares/authOnboarding');
const { getPresignedUploadUrl } = require('../controllers/storageController');

// Роут: обязательно требуем токен онбординга
router.get('/storage/presigned-upload', authOnboardingRequired, getPresignedUploadUrl);

module.exports = router;

