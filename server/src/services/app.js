const express = require('express');
const setUpRouters = require('../routes/index');

const app = express();

setUpRouters(app);

module.exports = app;
