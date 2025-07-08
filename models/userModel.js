const mongoose = require('../src/db');

const userSchema = new mongoose.Schema({
  userId: Number,
  chatId: String,
  confirmationCode: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
