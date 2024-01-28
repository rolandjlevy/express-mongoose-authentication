const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin', 'moderator']
  }
});

module.exports = model('User', UserSchema);
