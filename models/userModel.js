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
  // deviceId - уникальный идентификатор устройства для связки аккаунтов
  // Позволяет связать разные методы регистрации (email, telegram, google) в одну запись
  deviceId: { type: String, index: true, unique: true, sparse: true },

  chatId: { type: String, index: true, unique: true, sparse: true },
  confirmationCode: { type: String, index: true },  // не unique - временный код
  name: { type: String, index: true },  // не unique - имена могут повторяться
  email: { type: String, index: true, unique: true, sparse: true },

  // interests — одиночный объект, но опциональный
  interests: {
    type: new mongoose.Schema(
      {
        title: { type: String, trim: true },
        icon: { type: String, default: '' },
      },
      { _id: false }
    ),
    required: false,
    default: undefined,
  },

  googleId: { type: String, index: true, unique: true, sparse: true },
  age: { type: Number },
  userBirthday: { type: String },

  // Новая структура для пола
  gender: {
    id: { type: String, enum: ['male', 'female', 'other'], required: false },
    title: { type: String, trim: true }, // например: 'Мужской', 'Женский', 'Другие'
  },

  wishUser: { type: String, enum: ['male', 'female', 'all'] },
  userPhoto: { type: [UserPhotoSchema], default: [] },
  userLocation: { type: String, index: true },
  userSex: { type: String, enum: ['heterosexual', 'gay', 'lesbian', 'bisexual', 'asexual'] },

  // Флаг завершения онбординга
  onboardingComplete: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
