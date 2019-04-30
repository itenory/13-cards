// Array containing card markers
const deck = [
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'C10',
  'C11',
  'C12',
  'C13',
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'D10',
  'D11',
  'D12',
  'D13',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'H7',
  'H8',
  'H9',
  'H10',
  'H11',
  'H12',
  'H13',
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
  'S10',
  'S11',
  'S12',
  'S13'
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
 * Compares two cards to determine if card1 is greater, equal, or less than
 *  card2. Current rules are set that 2 and Ace are highest value with suits
 *  ranking as (H)earts ♥, (D)iamonds ♦, (C)lubs ♣, (S)pades ♠.
 * @param {*} card1 A card in string form being compared
 * @param {*} card2 A card in string form being compared
 * @return {Number} Returns a number indicating the whether the card1 is
 *  greater (1), equal (0), or less (-1) than card2.
 */
function compareCards(card1, card2) {
  // Check for same card
  if (card1 === card2) return 0;

  const c1Suit = card1.charAt(0);
  const c2Suit = card2.charAt(0);
  const c1Value = parseInt(card1.substring(1), 10);
  const c2Value = parseInt(card2.substring(1), 10);

  // If card values are the same, compare the suits
  if (c1Value === c2Value) {
    // Spades is the lowest suit, so automatically is the lower card
    if (c1Suit === 'S') return -1;
    if (c2Suit === 'S') return 1;

    // All other suits are ranked the same as their numerical value.
    return c1Suit > c2Suit ? 1 : -1;
  }

  // If either card is a 2 or Ace
  if (c1Value <= 2 || c2Value <= 2) {
    return c1Value === 2 || (c1Value === 1 && c2Value !== 2) ? 1 : -1;
  }

  return c1Value > c2Value ? 1 : -1;
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
    compareCards,
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
    playCard: async (roomId, cardToPlay, player) => {
      // Move card from players set to the board set
      const topCard = (await redisClient.smembersAsync(getBoardKey(roomId)))[0];

      if (!topCard || compareCards(cardToPlay, topCard) === 1) {
        return redisClient.smoveAsync(
          getHandKey(roomId, player),
          getBoardKey(roomId),
          cardToPlay
        );
      }

      return 0;
    }
  };
};
