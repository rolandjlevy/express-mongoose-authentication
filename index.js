const express = require('express');
const { connect, Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

connect(MONGODB_URI, {});

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = model('User', UserSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword
    });
    await user.save();
    res.send(`New user registered: ${username}`);
  } catch (err) {
    res.send(err);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        res.send('Logged in');
      } else {
        res.send('Incorrect password');
      }
    } else {
      res.send('Incorrect username');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Listening on port:${port}`);
});
