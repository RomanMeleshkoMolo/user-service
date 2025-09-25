const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { findOrCreateUserByUnique, updateUserById } = require('../services/userService');


router.post('/api/setDataFromTelegram', async (req, res) => {
  const data = { chatId, confirmationCode } = req.body;

  console.log( "here" );

  try {
    const existingUser = await User.findOne({ chatId });

    if ( !existingUser ) {

        await findOrCreateUserByUnique( data );

    } else {

        await updateUserById( data );

    }

  } catch (error) {
    console.error('Ошибка при обновлении базы данных:', error);
    res.status(500).send('Internal server error');
  }

});

module.exports = router;
