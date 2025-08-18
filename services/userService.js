const User = require('../models/userModel');

// Check of the data on type
function isNonEmptyObject( data ) {
  return typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length > 0;
}

async function createUser( data ) {

   if ( !isNonEmptyObject( data ) ) {
    console.log("Параметр data пустой");
    return;
  }

  const userCount = await User.countDocuments();
  const userId = userCount + 1;

  const newUser = await User.create({
    userId: userId,
    chatId: data.chatId,
    confirmationCode: data.confirmationCode,
    email: data.email,
  });

  console.log("Новый пользователь создан!:", newUser);

  return newUser;
}

async function updateUserConfirmationCode( data ) {

  if ( !isNonEmptyObject(data) ) {
    console.log("Параметр data пустой");
    return;
  }

  const updatedUser = await User.findOneAndUpdate(
    { chatId: data.chatId },
    { $set: { confirmationCode: data.confirmationCode } },
    { new: true }
  );

  console.log('Код подтверждения обновлен для существующего пользователя:', updatedUser);

  return updatedUser;
}

async function updateUser( data ) {

  if ( !isNonEmptyObject(data) ) {
    console.log("Параметр data пустой");
    return;
  }

  const updatedUser = await User.findOneAndUpdate(
    { userId: data.userId, },
    { $set: { name: data.name,
                     email: data.email,
                    } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('User not found');
  }

  console.log('Пользователя обновлено:', updatedUser);

  return updatedUser;
}

module.exports = {
  createUser,
  updateUserConfirmationCode,
  updateUser,
};
