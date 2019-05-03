const winston = require('winston');

const options = {
  file: {
  },
  console: {
    level: 'debug',
    handleException: true,
    json: false,
    colorize: true
  }
};


const transports = [];

// Add transports based on env
if (process.env.NODE_ENV === 'test' ) {
  transports.push(new winston.transports.Console(options.console));
}


const logger = winston.createLogger({
  transports,
  exitOnError: false
});

module.exports = logger;