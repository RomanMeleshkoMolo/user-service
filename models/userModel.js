const mongoose = require('../src/db');

const userSchema = new mongoose.Schema({
  // userId: Number,
  chatId: { type: String, index: true, unique: true, sparse: true },
  confirmationCode: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, index: true, unique: true, sparse: true }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
