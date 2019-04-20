const mongoose = require('mongoose');

const { Schema } = mongoose;

const roomSchema = new Schema({
  completed: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  started: { type: Boolean, default: false }
});

const Room = mongoose.model('room', roomSchema);
module.exports = Room;
