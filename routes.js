const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const router = express.Router();

const { authorize, generateToken } = require('./auth-middleware');
const User = require('./models/User');

router.use(
  '/projects',
  authorize(['user:read']),
  express.static(path.join(__dirname, '/projects'))
);

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

router.get('/project', authorize(['user:read']), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/project.html'));
});

router.get('/register', authorize(['user:create']), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/register.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/login.html'));
});

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        const token = generateToken(user);
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

router.get('/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) });
  res.sendFile(path.join(__dirname, '/public/login.html'));
});

module.exports = router;
