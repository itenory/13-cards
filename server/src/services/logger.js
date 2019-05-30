const path = require('path');
const winston = require('winston');

const options = {
  file: {
    level: 'info',
    filename: path.join(__dirname, '..', 'logs/', 'app.log'),
    handleException: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: 'debug',
    handleException: true,
    json: false,
    colorize: true
  }
};

const transports = [new winston.transports.File(options.file)];

// Add transports based on env
if (process.env.NODE_ENV !== 'ci') {
  transports.push(new winston.transports.Console(options.console));
}

const logger = winston.createLogger({
  transports,
  exitOnError: false
});

logger.stream = {
  write: (message, encoding) => {
    logger.info(message);
  }
};

module.exports = logger;
