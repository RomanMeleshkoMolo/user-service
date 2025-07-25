const User = require('../models/userModel');

const registerTelegram = async (req, res) => {
  const { userCode } = req.body;

  try {
    const user = await User.findOne({
      confirmationCode: userCode
    });

    if ( !user ) {
      return res.status(404).send({
        success: false
      });
    }

    res.status(200).send({
      success: true
    });

  } catch (error) {
    console.error('Error checking the code:', error);
    res.status(500).send('Internal server error');
  }
}

exports.registerTelegram = registerTelegram;
