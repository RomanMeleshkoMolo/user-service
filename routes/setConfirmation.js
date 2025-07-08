const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

router.post('/api/setConfirmation', async (req, res) => {
  const { chatId, confirmationCode } = req.body;

  try {
    const existingUser = await User.findOne({ chatId });

    if ( !existingUser ) {
      const userCount = await User.countDocuments();
      const userId = userCount + 1;

      const newUser = await User.create({
        userId: userId,
        chatId: chatId,
        confirmationCode: confirmationCode
      });
      console.log("Новый пользователь создан:", newUser);

      res.status(201).send(newUser);
    } else {
      // Here we are updating confirmationCode for exiting user
      const updatedUser = await User.findOneAndUpdate(
        { chatId },
        { $set: { confirmationCode: confirmationCode } },
        { new: true }
      );
      console.log('Код подтверждения обновлен для существующего пользователя:', updatedUser);

      res.status(200).send(updatedUser);
    }

  } catch (error) {
    console.error('Ошибка при обновлении базы данных:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;

