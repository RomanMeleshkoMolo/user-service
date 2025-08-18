const mongoose = require('../src/db');

const userSchema = new mongoose.Schema({
  userId: Number,
  chatId: String,
  confirmationCode: String,
  name: String,
  email: String
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
