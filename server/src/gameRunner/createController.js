// Array containing card markers
const deck = [
  'CA',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'C10',
  'CJ',
  'CQ',
  'CK',
  'DA',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'D10',
  'DJ',
  'DQ',
  'DK',
  'HA',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'H7',
  'H8',
  'H9',
  'H10',
  'HJ',
  'HQ',
  'HK',
  'SA',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
  'S10',
  'SJ',
  'SQ',
  'SK'
];

/**
 * Generates the redis key where the deck is stored.
 * @param {String} roomId Room id to form key for
 * @return {String} Returns a redis key for a deck.
 */
function getDeckKey(roomId) {
  return `${roomId}:deck`;
}

/**
 * Generates redis key where the player's hand is stored.
 * @param {String} roomId Id of the room the player belongs to
 * @param {String} player player to get hand for.
 * @return {String} Returns a redis key for a player's hand
 */
function getHandKey(roomId, player) {
  return `${roomId}:player:${player}`;
}

/**
 * Generates the redis key where the board (cards played) is stored.
 * @param {String} roomId Id of room to get board for
 * @return {String} Returns the redis key for a game board
 */
function getBoardKey(roomId) {
  return `${roomId}:board`;
}

/**
 * Creates methods needed to run game controller.
 * @param {Object} redisClient Promise-based client to interact with redis
 * @return {Object} Object containing functions for running game logic.
 */
module.exports = function createController(redisClient) {
  return {
    initGame: async (roomId, playerCount) => {
      // Clear all reset in case of remaining data
      await Promise.all([
        redisClient.delAsync(getDeckKey(roomId), 52),
        redisClient.delAsync(getBoardKey(roomId), 52),
        redisClient.delAsync(getHandKey(roomId, 1), 52),
        redisClient.delAsync(getHandKey(roomId, 2), 52),
        redisClient.delAsync(getHandKey(roomId, 3), 52),
        redisClient.delAsync(getHandKey(roomId, 4), 52)
      ]);

      await redisClient.saddAsync(getDeckKey(roomId), deck);
      for (let player = 1; player <= playerCount; player++) {
        const cards = await redisClient.spopAsync(getDeckKey(roomId), 5);
        await redisClient.saddAsync(getHandKey(roomId, player), cards);
      }
    },
    getPlayerHand: (roomId, player) => {
      return redisClient.smembersAsync(getHandKey(roomId, player));
    },
    getAllHands: roomId => {
      return Promise.all([
        redisClient.smembersAsync(getHandKey(roomId, 1)),
        redisClient.smembersAsync(getHandKey(roomId, 2)),
        redisClient.smembersAsync(getHandKey(roomId, 3)),
        redisClient.smembersAsync(getHandKey(roomId, 4))
      ]);
    },
    getBoard: roomId => {
      return redisClient.smembersAsync(getBoardKey(roomId));
    },
    playCard: (roomId, card, player) => {
      // Move card from players set to the board set
      return redisClient.smoveAsync(
        getHandKey(roomId, player),
        getBoardKey(roomId),
        card
      );
    }
  };
};
