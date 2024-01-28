/* eslint-disable consistent-return */
const express = require('express');
const { connect, Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const User = require('./models/User');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

connect(MONGODB_URI, {});

const generateToken = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

const verifyUserToken = (token) =>
  new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.log('403 Forbidden');
        reject(err);
      } else {
        console.log('JWT is valid');
        resolve(user);
      }
    });
  });

// middleware to handle JWT token authentication for Admin
const verifyAndAuthenticateAdminUser = async (req, res, next) => {
  console.log('###### verifyAndAuthenticateAdminUser');
  const token = req.headers['authorization'];
  if (!token) {
    console.log('###### 401');
    return res
      .status(401)
      .sendFile(path.join(__dirname, '/public/forbidden.html'));
  }
  try {
    const user = await verifyUserToken(token);
    console.log('###### user', user);
    if (user?.role === 'admin') {
      req.user = user;
      next();
    } else {
      res.sendStatus(403);
    }
  } catch (err) {
    console.error('Token verification failed:', err);
    res.sendStatus(403);
  }
};

const protectedRoute = (req, res, next) => {
  console.log('###### protectedRoute:', req.user);
  if (!req.user) {
    return res
      .status(403)
      .sendFile(path.join(__dirname, '/public/forbidden.html'));
  }
  next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get(
  '/register',
  verifyAndAuthenticateAdminUser,
  protectedRoute,
  (req, res) => {
    if (req.user) {
      res.sendFile(path.join(__dirname, '/public/register.html'));
    } else {
      res.sendFile(path.join(__dirname, '/public/forbidden.html'));
    }
  }
);

app.get('/login', (req, res) => {
  const redirect = req.query.redirect;
  if (redirect) {
    res.send(`Please log in to access the ${redirect} page`);
  } else {
    res.sendFile(path.join(__dirname, '/public/login.html'));
  }
});

app.get(
  '/protected',
  verifyAndAuthenticateAdminUser,
  protectedRoute,
  (req, res) => {
    res.send(`Welcome, ${req.user.username}! This page is protected`);
  }
);

// only for logged-in users with an 'admin' role can register
app.post(
  '/register',
  verifyAndAuthenticateAdminUser,
  protectedRoute,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        role: 'admin'
      });
      await user.save();
      res.send(`New user registered: ${username}`);
    } catch (err) {
      res.send(err);
    }
  }
);

// available to anyone
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        generateToken(user);
        res
          .status(200)
          .sendFile(path.join(__dirname, '/public/protected.html'));
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
