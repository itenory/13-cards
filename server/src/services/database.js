const mongoose = require('mongoose');

/**
 * Sets up connection to database.
 * @param {String} uri URI for mongoose connection
 * @param {object} options Mongoose options
 * @return {Promise} A promise to resolve when a connection is made.
 */
module.exports.connectDatabase = (uri, options = { useNewUrlParser: true }) => {
  return mongoose.connect(uri, options);
};

/**
 * Closes all connection to database.
 * @return {Promise} A promise to resolve once db connections are closed
 */
module.exports.disconnectDatabase = () => {
  return mongoose.disconnect();
};
