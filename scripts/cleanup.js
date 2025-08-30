// scripts/cleanup.js
require('dotenv').config(); // если используете .env
const mongoose = require('mongoose');

// скорректируйте путь к модели под вашу структуру
const User = require('../models/userModel');

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/users';
    await mongoose.connect(uri, {});

    const res = await User.deleteMany({
      $and: [
        { $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] },
        { $or: [{ phone: { $exists: false } }, { phone: null }, { phone: '' }] },
        { $or: [{ chatId: { $exists: false } }, { chatId: null }, { chatId: '' }] },
        { name: { $in: [null, '', undefined] } },
        { onboardingComplete: { $ne: true } },
      ],
    });

    console.log('Deleted empty drafts:', res.deletedCount);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
