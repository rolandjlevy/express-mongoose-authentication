const express = require('express');
const { connect } = require('mongoose');
const path = require('path');
const app = express();

require('dotenv').config();
const { MONGODB_URI, PORT } = process.env;
const port = PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

connect(MONGODB_URI, {});

const routes = require('./routes');
app.use(routes);

app.listen(port, () => {
  console.log(`Listening on port:${port}`);
});
