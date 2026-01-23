const transporter = require('../config/nodemailerConfig');
const renderEmailTemplate = require('../src/templateRenderer');
const User = require('../models/userModel');

const registerEmail = async (req, res) => {
 try {
    const { email, deviceId } = req.body;

  console.log('registerEmail: получены данные', { email, deviceId });

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
  if (deviceId && !user.deviceId) user.deviceId = deviceId;
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

 // ШАГ 1: Ищем пользователя по deviceId (связка с существующим аккаунтом Telegram)
 if (deviceId) {
   const userByDevice = await User.findOne({ deviceId });
   if (userByDevice) {
     console.log('registerEmail: найден пользователь по deviceId', userByDevice._id);

     // Проверяем, не занят ли этот email другим пользователем
     const existingByEmail = await User.findOne({ email: normalizedEmail });
     if (existingByEmail && existingByEmail._id.toString() !== userByDevice._id.toString()) {
       return res.status(409).json({ message: 'This email is already in use by another user' });
     }

     // Добавляем email к существующему пользователю (связываем аккаунты)
     userByDevice.email = normalizedEmail;
     userByDevice.isEmailVerified = false;
     userByDevice.confirmationCode = confirmationCode;
     await userByDevice.save();

     await transporter.sendMail({
       from: '"Molo" <molo.app1@gmail.com>',
       to: userByDevice.email,
       subject: `Твой код: ${confirmationCode}`,
       html: renderEmailTemplate(confirmationCode),
     });

     return res.status(200).json({
       message: 'Email привязан к существующему аккаунту',
       userId: userByDevice._id,
       email: userByDevice.email,
       confirmationCode: userByDevice.confirmationCode,
     });
   }
 }

 // ШАГ 2: Ищем пользователя по email
 const existingUser = await User.findOne({ email: normalizedEmail });

 if (existingUser) {
   // Если email уже подтверждён — регистрация на этот email запрещена
   if (existingUser.isEmailVerified) {
     return res.status(409).json({ message: 'This email is already in use by another user' });
   }

   // Email не подтверждён — переотправляем новый код
   existingUser.confirmationCode = confirmationCode;
   if (deviceId && !existingUser.deviceId) existingUser.deviceId = deviceId;
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

 // ШАГ 3: Создаём нового пользователя с deviceId
 const newUserData = {
   email: normalizedEmail,
   isEmailVerified: false,
   confirmationCode,
 };
 if (deviceId) newUserData.deviceId = deviceId;

 const newUser = await User.create(newUserData);
 console.log('registerEmail: создан новый пользователь', newUser._id);

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

