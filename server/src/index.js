const http = require('http');
require('dotenv').config();
const app = require('./services/app');
const { connectDatabase } = require('./services/database');
const { setupRedis } = require('./services/redis');
const setupSocket = require('./services/socket');
const logger = require('./services/logger');

// Initialize Database, redis, and socket before listening to server request
connectDatabase(process.env.DB_URI)
  .then(async () => {
    await setupRedis(process.env.redis_port, process.env.redis_host);

    // Create server
    const server = http.createServer(app);
    setupSocket(server);

    server.listen(process.env.SERVER_PORT, process.env.SERVER_IP, () => {
      console.log(
        `Server running: ${process.env.SERVER_IP}:${process.env.SERVER_PORT}`
      );
    });
  })
  .catch(err => {
    // Log server crashing errors
    logger.info(err.message);
    process.exit(1);
  });
