import io from 'socket.io-client';

let socket;
const QUEUEUPDATE = 'queueUpdate';

export function setupSocket(host, options = {}) {
  socket = io.connect(host, options);
}

/**
 * Creates event listeners for updates to game queue state.
 * @param {Function} cb Event handler for game queue events.
 * @return {Boolean} Returns a boolean indicating if socket listener was created.
 */
export function subscribeQueue(cb) {
  if (!socket || !socket.connected) return false;
  socket.on(QUEUEUPDATE, cb);
  return true;
}

/**
 * Removes event listeners for game queue.
 */
export function unsubscribeQueue() {
  socket.off(QUEUEUPDATE);
}

/**
 * Emits a event to server to start game.
 * @param {String} gameId Id of game to start.
 */
export function startGame(gameId) {
  socket.emit('startGame', gameId);
}

/**
 * Emits socket event for current player to play cards.
 * @param {Array<String>} cards Array of cards to be played
 */
export function playCards(cards, player) {
  socket.emit('playCards', cards, player);
}

/**
 * Emits socket event for current player to pass their turn.
 * @param {String} player Id of player passing their turn.
 */
export function passTurn(player) {
  socket.emit('passTurn', player);
}

/**
 * Emits a socket event for client to join game room.
 * @param {String} gameId Id of game to join
 */
export function joinGame(gameId) {
  socket.emit('joinGame', gameId);
}

/**
 * Emits a socket event for client to leave game room.
 * @param {String} gameId Id of game to leave
 */
export function leaveGame(gameId) {
  socket.emit('leaveGame', gameId);
}

/**
 * Gets and returns the socket id.
 *  @return {String} Returns the socket id for the user as their id.
 */
export function getUserId() {
  return socket.id;
}
