import io from 'socket.io-client';

let socket;

export function setupSocket(host, options = {}) {
  io.connect(host, options);
}

/**
 * Emits a event to server to start game.
 */
export function startGame() {
  socket.emit('startGame');
}
