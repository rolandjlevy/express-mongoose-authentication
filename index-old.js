const express = require('express');
const { connect } = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

require('dotenv').config();
const port = process.env.PORT || 3000;
const { MONGODB_URI } = process.env;
const { authorize, generateToken } = require('./auth-middleware');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const User = require('./models/User');

connect(MONGODB_URI, {});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/project', authorize(['user:read']), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/project.html'));
});

app.get('/register', authorize(['user:create']), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      scopes: ['user:read', 'user:create']
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
        const token = generateToken(user);
        console.log({ token, user });
        // add token to HTTP-only cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict'
        });
        res.status(200).sendFile(path.join(__dirname, `/public/index.html`));
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

app.get('/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) });
  res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.listen(port, () => {
  console.log(`Listening on port:${port}`);
});
