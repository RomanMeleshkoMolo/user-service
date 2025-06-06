const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: 'molo.app1@gmail.com', // замените на ваш email
    pass: 'dgmc zczo yedp kbzb',  // замените на ваш пароль
  },
});

module.exports = transporter;
