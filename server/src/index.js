const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const app = require('./services/app');
const server = http.createServer(app);

server.listen(process.env.SERVER_PORT, process.env.SERVER_IP, () => {
  console.log('Server is running');
});
