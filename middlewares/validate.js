const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message).join('; ');
      return res.status(400).json({ message: messages });
    }
    next();
  };
}

const schemas = {
  startOnboarding: Joi.object({
    email: Joi.string().email().max(255),
    provider: Joi.string().valid('email', 'google', 'telegram').max(20),
    googleId: Joi.string().max(255),
    telegramId: Joi.alternatives(Joi.string(), Joi.number()),
    deviceId: Joi.string().max(255),
    identity: Joi.object(),
  }),

  updateName: Joi.object({
    name: Joi.string().min(1).max(100).required(),
  }),

  saveBirthday: Joi.object({
    birthday: Joi.string().max(30).required(),
  }),

  saveGender: Joi.object({
    gender: Joi.object({
      id: Joi.string().valid('male', 'female', 'other').required(),
      title: Joi.string().max(50),
    }).required(),
  }),

  saveWish: Joi.object({
    wishUser: Joi.string().valid('male', 'female', 'all').required(),
  }),

  saveOrientation: Joi.object({
    userSex: Joi.string().valid('heterosexual', 'homosexual', 'bisexual').required(),
  }),

  saveLocation: Joi.object({
    payload: Joi.object({
      userLocation: Joi.string().max(255),
    }),
    userLocation: Joi.string().max(255),
  }),

  saveInterest: Joi.object({
    interests: Joi.array().items(Joi.string().max(50)).max(20),
    interest: Joi.string().max(50),
    lookingFor: Joi.object(),
  }),

  savePhotos: Joi.object({
    photos: Joi.array().items(Joi.object({
      key: Joi.string().max(500).required(),
      filename: Joi.string().max(255),
      mimeType: Joi.string().max(50),
      size: Joi.number().max(50 * 1024 * 1024),
    })).max(10),
  }),

  refresh: Joi.object({
    deviceId: Joi.string().max(255).required(),
  }),

  googleAuth: Joi.object({
    idToken: Joi.string().max(5000),
    googleId: Joi.string().max(255),
    email: Joi.string().email().max(255),
    name: Joi.string().max(100),
    photo: Joi.string().max(1000),
    deviceId: Joi.string().max(255),
  }),

  registerEmail: Joi.object({
    email: Joi.string().email().max(255).required(),
    deviceId: Joi.string().max(255),
  }),

  checkDevice: Joi.object({
    deviceId: Joi.string().max(255).required(),
  }),

  onlineStatus: Joi.object({
    isOnline: Joi.boolean().required(),
  }),
};

module.exports = { validate, schemas };
