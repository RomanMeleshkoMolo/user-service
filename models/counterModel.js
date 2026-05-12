const mongoose = require('../src/db');

const counterSchema = new mongoose.Schema({
  name: String,
  seq: Number,
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

module.exports = Counter;
