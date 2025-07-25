const User = require('../models/userModel');

const updateUserName = async (req, res) => {
  const { userId, name } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { userId: userId },
      { $set: { name: name } },
      { new: true }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send('Error updating user name');
  }
};

exports.updateUserName = updateUserName;
