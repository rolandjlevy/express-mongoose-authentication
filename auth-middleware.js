/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const path = require('path');
const { JWT_SECRET } = process.env;
const cookieParser = require('cookie');

const generateToken = (user) => {
  const payload = { username: user.username, scopes: user.scopes };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

const authorize = (permissions = []) => {
  return async (req, res, next) => {
    let token;
    // find the token within the cookie
    if (req.headers.cookie) {
      const cookies = cookieParser.parse(req.headers.cookie);
      token = cookies?.token;
    }
    if (!token) {
      // access denied: token missing from cookie
      return res
        .status(401)
        .sendFile(path.join(__dirname, '/public/access-denied.html'));
    } else {
      // validate JWT
      jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        if (err) {
          // access denied: verification error
          console.log(`JWT error: ${err}`);
          return res
            .status(401)
            .sendFile(path.join(__dirname, '/public/access-denied.html'));
        }
        // check for permissions within user's scopes
        if (permissions?.length) {
          if (
            decodedToken?.scopes?.length &&
            permissions.some((permission) =>
              decodedToken?.scopes.includes(permission)
            )
          ) {
            // permission granted
            req.user = decodedToken;
            next();
          } else {
            // access denied: no permission
            return res
              .status(401)
              .sendFile(path.join(__dirname, '/public/access-denied.html'));
          }
        } else {
          // permissions not required
          req.user = decodedToken;
          next();
        }
      });
    }
  };
};

module.exports = {
  generateToken,
  authorize
};
