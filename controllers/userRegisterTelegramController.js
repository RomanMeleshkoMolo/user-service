const User = require('../models/userModel');
const { createUser, updateUserConfirmationCode } = require('../services/userService');

const registerTelegram = async (req, res) => {
  const { userCode } = req.body;


  // try {
  //
  //   const existingUser = await User.findOne({ chatId });
  //
  //   if ( !existingUser ) {
  //
  //     const newUser = await createUser(chatId, confirmationCode);
  //     res.status(201).json(newUser);
  //
  //   }else {
  //
  //     const updatedUser = await updateUserConfirmationCode(chatId, confirmationCode);
  //     res.status(200).send(updatedUser);
  //
  //   }
  //
  // }catch (error) {
  //
  //   console.error('Ошибка при создании пользователя:', error);
  //   res.status(500).json({ error: 'Ошибка при создании пользователя' });
  //
  // }


  try {
    const user = await User.findOne({
      confirmationCode: userCode
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.status(200).send( user );

    // if ( !user ) {
    //   return res.status(404).send({
    //     success: false
    //   });
    // }
    //
    // res.status(200).send({
    //   success: true
    // });

  } catch (error) {
    console.error('Error checking the code:', error);
    res.status(500).send('Internal server error');
  }
}

exports.registerTelegram = registerTelegram;
