const io = require('socket.io');
const { markRoomStarted } = require('./room');
const {
  initGame,
  getBoard,
  getLastPlayer,
  getCurrentPlayer,
  getAllHands,
  getHandByPlayerId
} = require('./redis');

// Socket event names to send to clients
const QUEUEUPDATE = 'queueUpdate';
const GAMEUPDATE = 'gameUpdate';

// Socket event names to be received
const GETGAMESTATE = 'getGameState';
const STARTGAME = 'startGame';
const JOINGAME = 'joinGame';
const LEAVEGAME = 'leaveGame';

let socket;
/**
 * Emits a socket event to a specific room. Willonly emit event if
 *  room is provided and socket is initialized.
 * @param {String} room Name of room to emit event to
 * @param {String} event Type of event to emit
 * @param  {...any} args Any other arguments to send with event
 */
function emitToRoom(room, event, ...args) {
  if (socket && room) socket.to(room).emit(event, ...args);
}

/**
 * Adds client socket to game room and emits an event with updated
 *  queue data.
 * @param {String} gameId Id of game to join
 */
function joinGame(gameId) {
  this.join(gameId);
  const playerCount = socket.sockets.adapter.rooms[gameId].length;
  emitToRoom(gameId, QUEUEUPDATE, { playerCount });
}

/**
 * Removes client socket from the game room and emits an event with update
 *  queue data.
 * @param {String} gameId Id of game client is trying to leave.
 */
function leaveGame(gameId) {
  this.leave(gameId);
  const playerCount = socket.sockets.adapter.rooms[gameId].length;
  emitToRoom(gameId, QUEUEUPDATE, { playerCount });
}

/**
 * Event Handler for starting a game. Client must be in room to join
 * @param {String} gameId
 */
async function startGame(gameId) {
  // Client must be in room
  if (this.rooms[gameId] && gameId) {
    const players = Object.keys(socket.sockets.adapter.rooms[gameId].sockets);
    const playerCount = socket.sockets.adapter.rooms[gameId].length;

    await initGame(gameId, players, playerCount);
    await markRoomStarted(gameId, players);

    // Emit message back to clients
    emitToRoom(gameId, QUEUEUPDATE, { matchStart: true });
  }
}

/**
 * Socket event handler for getting current state of a game. State includes
 *  all necessary data to play game.
 * @param {String} gameId Id of a game
 */
async function getGameState(gameId) {
  try {
    const [board, current, last, hands, hand] = await Promise.all([
      getBoard(),
      getCurrentPlayer(),
      getLastPlayer(gameId),
      getAllHands(gameId),
      getHandByPlayerId(gameId, this.id)
    ]);

    const handCount = hands.map(hand => hand.length);

    const gameState = {
      board,
      current,
      last,
      hand,
      handCount
    };

    this.emit(GAMEUPDATE, gameState);
  } catch (err) {
    // Emit error moessage
    this.emit(GAMEUPDATE, { error: 'Server error' });
  }
}

/**
 * Event handler for client socket disconnect. Sends message to all rooms
 *  socket belongs to updating game room data.
 */
function disconnect() {
  Object.values(this.rooms).forEach(roomId => {
    this.leave(roomId);
    const room = socket.sockets.adapter.rooms[roomId];
    if (room) emitToRoom(roomId, QUEUEUPDATE, { playerCount: room.length });
  });
}

/**
 * Attachs socket to server and returns socket object.
 * @param {Object} server Http server to attach socket to
 * @param {Object} controller Object containing data store functions
 * @return {Object} Returns socket object.
 */
module.exports = function setupSocket(server) {
  socket = io(server);

  // Add event handlers to client socket as they connect
  socket.on('connect', client => {
    client.on('disconnecting', disconnect);

    client.on(JOINGAME, joinGame);
    client.on(LEAVEGAME, leaveGame);
    client.on(STARTGAME, startGame);
    client.on(GETGAMESTATE, getGameState);
  });

  return socket;
};
