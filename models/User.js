const { Schema, models, model } = require('mongoose');

const collectionName = 'users';

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true
  },
  password: { type: String, required: [true, 'Password is required'] },
  scopes: { type: Array, required: true, default: ['user:read'] }
});

module.exports = models.User || model('User', UserSchema, collectionName);
