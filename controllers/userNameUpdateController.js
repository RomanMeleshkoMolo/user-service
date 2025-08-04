// const User = require('../models/userModel');
const { createUser, updateUserName } = require('../services/userService');

const userNameUpdateController = async (req, res) => {
  const { userId, name } = req.body;

  console.log("userId - " + createUser.userId);

  try {


    const updatedUser = await updateUserName(userId, name);
    res.status(201).send(updatedUser);

    // const user = await User.findOneAndUpdate(
    //   { userId: createUser.userId },
    //   { $set: { name: name } },
    //   { new: true }
    // );



    // if (!user) {
    //   return res.status(404).send('User not found');
    // }

    // res.status(200).send(user);
  } catch (error) {
    res.status(500).send('Error updating user name');
  }
};

exports.userNameUpdateController = userNameUpdateController;
