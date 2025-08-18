const {  updateUser } = require('../services/userService');

const userNameUpdateController = async (req, res) => {
  const data = { userId, name } = req.body;

  try {

    const updatedUser = await updateUser( data );
    res.status(200).send(updatedUser);

  } catch (error) {
    res.status(500).send('Error updating user name');
  }
};

exports.userNameUpdateController = userNameUpdateController;
