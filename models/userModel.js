const mongoose = require('../src/db');

const InterestSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    icon: { type: String, default: '' },
  },
  { _id: false }
);

const UserPhotoSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    bucket: { type: String, required: true },
    url: { type: String },
    status: { type: String, enum: ['approved', 'rejected'], required: true },
    reason: { type: String },
    moderation: { type: Array },
    faceCount: { type: Number },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  chatId: { type: String, index: true, unique: true, sparse: true },
  confirmationCode: { type: String, index: true, unique: true, sparse: true },
  name: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, index: true, unique: true, sparse: true },

  // interests — одиночный объект, но опциональный
  interests: {
    type: InterestSchema,
    required: false,
    default: undefined, // важно: чтобы не создавался пустой объект
  },

  googleId: { type: String, index: true, unique: true, sparse: true },
  age: { type: Number },
  userBirthday: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  wishUser: { type: String, enum: ['male', 'female', 'all'] },
  userPhoto: { type: [UserPhotoSchema], default: [] },
  userLocation: { type: String, index: true },
  userSex: { type: String, enum: ['heterosexual', 'gay', 'lesbian', 'bisexual', 'asexual'] },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;

