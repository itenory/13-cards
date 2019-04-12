const http = require('http');
require('dotenv').config();
const app = require('./services/app');
const { connectDatabase } = require('./services/database');

connectDatabase(process.env.DB_URI)
  .then(() => {
    // Create server
    const server = http.createServer(app);
    server.listen(process.env.SERVER_PORT, process.env.SERVER_IP, () => {
      console.log('Server is running');
    });
  })
  .catch(err => {
    process.exit(1);
  });
