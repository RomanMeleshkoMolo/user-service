const transporter = require('../config/nodemailerConfig');
const renderEmailTemplate = require('../src/templateRenderer');

const User = require('../models/userModel');
const { createUser, updateUser } = require('../services/userService');

const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

const registerEmail = async (req, res) => {
  const data = { email } = req.body;

  let userId;

  if ( !email ) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Check if user exist in db
  const existingUser = await User.findOne({ userId: this.userId });

  if ( !existingUser ) {

    const user = await createUser( data );
    user.confirmationCode = confirmationCode;

    this.userId = user.userId;

    res.status(200).json( user );

  } else {

    data.userId = this.userId;

    const user = await updateUser( data );
    res.status(201).json( user );

  }

  const mailOptions = {
    from: '"Molo" <molo.app1@gmail.com>',
    to: data.email,
    subject: `Твой код: ${confirmationCode}`,
    html: renderEmailTemplate(confirmationCode)
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({message: 'Error sending email roman', error});
    }

    res.status(200).json({message: 'Confirmation code sent', code: confirmationCode});
  });

}

exports.registerEmail = registerEmail;
