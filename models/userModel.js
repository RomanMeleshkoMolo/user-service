const mongoose = require('../src/db');

const userSchema = new mongoose.Schema({
  chatId: { type: String, index: true, unique: true, sparse: true },
  confirmationCode: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, index: true, unique: true, sparse: true },
  interests: { type: [String], default: [] },
  age: { type: Number },
  userBirthday: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'],}
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
