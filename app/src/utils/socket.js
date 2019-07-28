import io from 'socket.io-client';

let socket;

// Socket event names
const QUEUEUPDATE = 'queueUpdate';
const GAMEUPDATE = 'gameUpdate';

const GETGAMESTATE = 'getGameState';

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
 * Creates an event listener to handle game state updates.
 * @param {Function} cb Event handler for game state updates
 * @return {Boolean} Returns a boolean indicating if socket handler was set.
 */
export function subscribeRoom(cb) {
  if (!socket || !socket.connected) return false;
  socket.on(GAMEUPDATE, cb);
  return true;
}

/**
 * Removes event listener for game state updates.
 */
export function unsubscribeRoom() {
  socket.off(GAMEUPDATE);
}

/**
 * Sends a socket event to get current state of a game
 * @param {String} gameId Id of a game.
 */
export function getGameState(gameId) {
  socket.emit(GETGAMESTATE, gameId);
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
