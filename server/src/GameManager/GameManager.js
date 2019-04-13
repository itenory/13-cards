const { setUpSocket, closeSocket } = require('./socket');
const { connectRedis, closeRedis } = require('./redis');

class GameManager {
  /**
   * Initializes game manager settings and socket server.
   * @param {Object} server The http server to use for the game.
   */
  constructor(server) {
    const { address, port } = server.address();
    setUpSocket(server);
    connectRedis(address, port);
  }

  closeGameServer() {
    closeRedis(() => {
      closeSocket();
    });
  }
}

module.exports = GameManager;
