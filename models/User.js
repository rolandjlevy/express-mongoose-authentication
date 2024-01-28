const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true
  },
  password: { type: String, required: [true, 'Password is required'] },
  scopes: { type: Array, required: true, default: ['user:read'] }
});

module.exports = model('User', UserSchema);
