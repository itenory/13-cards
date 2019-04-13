const { promisify } = require('util');
const redis = require('redis');

let redisClient;

/**
 * Creates a redis client and connectes it using given HOST and PORT.
 * @param {String} HOST Host to attach redis server to
 * @param {Number} PORT Port to attach redis server to
 * @param {Function} cb Function to call once redis client is connected
 */
exports.connectRedis = (HOST, PORT, cb = null) => {
  redisClient = redis.createClient(PORT, HOST);

  if (cb) redisClient.once('connect', cb);
};

/**
 * Closes connection to redis.
 * @param {Function} cb Function to call once redis client is closed
 */
exports.closeRedis = (cb = null) => {
  redisClient.quit(cb);
};
