import io from 'socket.io-client';

let socket;
const QUEUEUPDATE = 'queueUpdate';
const NEWPLAYER = 'newPlayer';

export function setupSocket(host, options = {}) {
  socket = io.connect(host, options);
}

/**
 *
 * @param {Function} cb Event handler for game queue events.
 */
export function subscribeQueue(cb) {
  socket.on(QUEUEUPDATE, cb);
}

/**
 *
 */
export function unsubscribeQueue() {
  socket.off(QUEUEUPDATE);
  socket.off(NEWPLAYER);
}

/**
 * Emits a event to server to start game.
 */
export function startGame(gameId) {
  socket.emit('startGame', gameId);
}

/**
 *
 * @param {Array<String>} cards
 */
export function playCards(cards, player) {
  socket.emit('playCards', cards, player);
}

/**
 *
 * @param {String} player
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
