const transporter = require('../config/nodemailerConfig');
const renderEmailTemplate = require('../src/templateRenderer');
const User = require('../models/userModel');

const registerEmail = async (req, res) => {
 try {
    const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

// Если пользователь авторизован — обновляем его email
if (req.user?.id) {
  // Проверка занятости email другим пользователем
  const existingByEmail = await User.findOne({ email: normalizedEmail });
  if (existingByEmail && existingByEmail._id.toString() !== req.user.id) {
    return res.status(409).json({ message: 'This email is already in use by another user' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.email = normalizedEmail;
  user.isEmailVerified = false; // сбрасываем верификацию при смене email
  user.confirmationCode = confirmationCode;
  await user.save();

  await transporter.sendMail({
    from: '"Molo" <molo.app1@gmail.com>',
    to: user.email,
    subject: `Твой код: ${confirmationCode}`,
    html: renderEmailTemplate(confirmationCode),
  });

  return res.status(200).json({
    message: 'Confirmation code sent',
    userId: user._id,
    email: user.email,
    confirmationCode: user.confirmationCode,
  });
}

 // Публичный поток (без авторизации)
 const existingUser = await User.findOne({ email: normalizedEmail });

 if (existingUser) {
   // Если email уже подтверждён — регистрация на этот email запрещена
   if (existingUser.isEmailVerified) {
     return res.status(409).json({ message: 'This email is already in use by another user' });
   }

   // Email не подтверждён — переотправляем новый код
   existingUser.confirmationCode = confirmationCode;
   await existingUser.save();

   await transporter.sendMail({
     from: '"Molo" <molo.app1@gmail.com>',
     to: existingUser.email,
     subject: `Твой код: ${confirmationCode}`,
     html: renderEmailTemplate(confirmationCode),
   });

   return res.status(200).json({
     message: 'Confirmation code sent',
     userId: existingUser._id,
     email: existingUser.email,
     confirmationCode: existingUser.confirmationCode,
   });
 }

 // Создаём нового "незавершённого" пользователя
 const newUser = await User.create({
   email: normalizedEmail,
   isEmailVerified: false,
   confirmationCode,
 });

 await transporter.sendMail({
   from: '"Molo" <molo.app1@gmail.com>',
   to: newUser.email,
   subject: `Твой код: ${confirmationCode}`,
   html: renderEmailTemplate(confirmationCode),
 });

 return res.status(200).json({
   message: 'Confirmation code sent',
   userId: newUser._id,
   email: newUser.email,
   confirmationCode: newUser.confirmationCode,
 });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'This email is already in use by another user' });
    }
    console.error('registerEmail error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
 };

module.exports = { registerEmail };

