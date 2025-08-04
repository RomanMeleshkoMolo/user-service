const express = require('express');
const router = express.Router();

const { userNameUpdateController } = require('../controllers/userNameUpdateController');

router.put('/updateUserName', userNameUpdateController);

module.exports = router;
