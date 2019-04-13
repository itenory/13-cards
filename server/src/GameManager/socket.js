const socket = require('socket.io');

let io;

/**
 * Set up socket on http server
 * @param {Object} server The http server to attach socket to.
 */
exports.setUpSocket = server => {
  io = socket(server);

  io.on('connection', client => {});
};

/**
 * Closes connection to server
 */
exports.closeSocket = () => {
  io.close();
};

/**
 * Emit an event to a socket by it's id.
 * @param {String} id Id of socket to emit message to
 * @param {String} event Type of event to emit message on
 * @param {Any} args Additional arguments to send through socket
 */
exports.emitMessageToSocket = (id, event, ...args) => {
  if (io && id) io.to(id).emit(event, ...args);
};

/**
 * Emits an event to all sockets in the room using the room's Id.
 * @param {String} roomId Id of room to emit event to
 * @param {String} event The event to emit to the room
 * @param {Any} args Additional arguments to send to room
 */
exports.emitMessageToRoom = (roomId, event, ...args) => {
  if (io && roomId) io.to(roomId).emit(event, ...args);
};
