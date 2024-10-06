/* eslint-disable consistent-return */
const jwt = require('jsonwebtoken');
const path = require('path');
const { JWT_SECRET } = process.env;
const cookieParser = require('cookie');

const generateToken = (user) => {
  const { username, scopes } = user;
  return jwt.sign({ username, scopes }, JWT_SECRET, { expiresIn: '1h' });
};

const authorize = (permissions = []) => {
  return async (req, res, next) => {
    let token = '';
    // Find the token within the cookie
    if (req.headers.cookie) {
      const cookies = cookieParser.parse(req.headers.cookie);
      token = cookies?.token || '';
    }

    const accessDeniedPath = path.join(__dirname, '/public/access-denied.html');

    if (!token) {
      // Access denied: Token missing from cookie
      return res.status(401).sendFile(accessDeniedPath);
    }

    try {
      // Validate JWT
      const decodedToken = await jwt.verify(token, JWT_SECRET);

      if (permissions.length > 0) {
        const hasPermission = permissions.some((permission) =>
          decodedToken?.scopes?.includes(permission)
        );

        if (hasPermission) {
          req.user = decodedToken;
          next(); // Permission granted
        } else {
          // Access denied: No permission
          return res.status(401).sendFile(accessDeniedPath);
        }
      } else {
        // Permissions not required
        req.user = decodedToken;
        next();
      }
    } catch (err) {
      console.log(`JWT error: ${err}`);
      return res.status(401).sendFile(accessDeniedPath);
    }
  };
};

module.exports = {
  generateToken,
  authorize
};
