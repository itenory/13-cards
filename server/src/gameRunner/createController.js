/* eslint-disable no-await-in-loop */
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
 * Generates redis key for current player.
 * @param {String} roomId
 * @return {String} Returns the redis key for
 */
function getCurrentPlayerKey(roomId) {
  return `${roomId}:current`;
}

/**
 * Generates a redis key for the last player to move.
 * @param {String} roomId Id of room to generate key for
 * @return {String} Returns redis key for lasst player.
 */
function getLastPlayerKey(roomId) {
  return `${roomId}:last`;
}

/**
 *
 * @param {String} roomId
 * @return {String} Returns a string with the
 */
function getLowestDealtKey(roomId) {
  return `${roomId}:lowest`;
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
 *
 * @param {Array<String>} hand Array of cards to find the lowest in
 * @return {String} Returns lowest cards in hand.
 */
function getLowestCard(hand) {
  let lowest = hand[0];

  hand.forEach(card => {
    if (compareCards(lowest, card) === 1) {
      lowest = card;
    }
  });

  return lowest;
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

      const lows = []; // Stores the lowest card from each hand
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

        // Get lowest card from each hand
       lows.push(getLowestCard(cards));
      }

      const lowestDealt = getLowestCard(lows); // Find lowest dealt
      return redisClient.setAsync(getLowestDealtKey(roomId), lowestDealt);
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

      // Get top card, current & last player
      let [topCard, currentPlayer, lastPlayer] = await Promise.all([
        redisClient.smembersAsync(getBoardKey(roomId)),
        redisClient.getAsync(getCurrentPlayerKey(roomId)),
        redisClient.getAsync(getLastPlayerKey(roomId))
      ]);

      // First card(s) played must be lowest
      if (!currentPlayer) {
        const lowest = await redisClient.getAsync(getLowestDealtKey(roomId));

        if (cardToPlay !== lowest) {
          return 0;
        }
        currentPlayer = player;
      } else if (currentPlayer != player) {
        return 0;
      }

      // If no player played last, then must be lowest card in all hands
      if (!topCard[0] || compareCards(cardToPlay, topCard[0]) === 1) {
        const validMove = await redisClient.smoveAsync(
          getHandKey(roomId, player),
          getBoardKey(roomId),
          cardToPlay
        );

        // If move was made, update current
        if (validMove) {
          const nextPlayer = (parseInt(currentPlayer, 10) + 1) % 4;

          return Promise.all([
            redisClient.setAsync(getCurrentPlayerKey(roomId), nextPlayer),
            redisClient.setAsync(getLastPlayerKey(roomId), player)
          ]);
        }

        return 0;
      }

      return 0;
    },
    getLowest: roomId => redisClient.getAsync(getLowestDealtKey(roomId)),
    getCurrentPlayer: roomId =>
      redisClient.getAsync(getCurrentPlayerKey(roomId)),
    getLastPlayer: roomId => redisClient.getAsync(getLastPlayerKey(roomId))
  };
};
