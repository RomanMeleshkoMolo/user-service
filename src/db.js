const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/molo_auth';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('[user-service] MongoDB connected → molo_auth'))
  .catch((err) => console.error('[user-service] MongoDB connection error:', err));

module.exports = mongoose;
