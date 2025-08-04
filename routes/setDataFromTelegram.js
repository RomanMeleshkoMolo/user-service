const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { createUser, updateUserConfirmationCode } = require('../services/userService');


router.post('/api/setDataFromTelegram', async (req, res) => {
  const { chatId, confirmationCode } = req.body;

  try {
    const existingUser = await User.findOne({ chatId });

    if ( !existingUser ) {

        const newUser = await createUser(chatId, confirmationCode);

    } else {

        const updatedUser = await updateUserConfirmationCode(chatId, confirmationCode);

    }

  } catch (error) {
    console.error('Ошибка при обновлении базы данных:', error);
    res.status(500).send('Internal server error');
  }

});

module.exports = router;

