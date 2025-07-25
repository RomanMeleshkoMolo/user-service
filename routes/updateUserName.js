const express = require('express');
const router = express.Router();

const { updateUserName } = require('../controllers/userNameUpdateController');

router.put('/updateUserName', updateUserName);

module.exports = router;
