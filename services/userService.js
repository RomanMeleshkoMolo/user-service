const User = require('../models/userModel');

async function createUser(chatId, confirmationCode) {
  const userCount = await User.countDocuments();
  const userId = userCount + 1;

  const newUser = await User.create({
    userId: userId,
    chatId: chatId,
    confirmationCode: confirmationCode
  });


  console.log("Новый пользователь создан!:", newUser);

  return newUser;
}

async function updateUserConfirmationCode(chatId, confirmationCode) {
  const updatedUser = await User.findOneAndUpdate(
    { chatId },
    { $set: { confirmationCode: confirmationCode } },
    { new: true }
  );

  console.log('Код подтверждения обновлен для существующего пользователя:', updatedUser);

  return updatedUser;
}

async function updateUserName(userId, name) {
  const updatedUser = await User.findOneAndUpdate(
    { userId: userId },
    { $set: { name: name } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('User not found');
  }

  console.log('Имя пользователя обновлено:', updatedUser);

  return updatedUser;
}

module.exports = {
  createUser,
  updateUserConfirmationCode,
  updateUserName
};
