const bluebird = require('bluebird');
const redis = require('redis');

// Promisify all redis functions
bluebird.promisifyAll(redis);
let redisClient;
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
 * Generates and returns the redis key for a room's deck.
 * @param {String} roomId Id of room to get deck key for
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
 * Generates and returns the redis key for the highest ranked card on board.
 * @param {String} roomId Id of the room to get top card for
 * @return {String} Returns the redis key for highest rank card on board.
 */
function getTopKey(roomId) {
  return `${roomId}:top`;
}

/**
 * Generates and returns the redis key for the board type for a specific room.
 * @param {String} roomId Id of room to get board type for
 * @return {String} Returns the redis key for the current board type.
 */
function getBoardTypeKey(roomId) {
  return `${roomId}:boardType`;
}

/**
 * Generates and returns a redis key for current player.
 * @param {String} roomId Id of room to get current player for
 * @return {String} Returns the redis key for the current player.
 */
function getCurrentPlayerKey(roomId) {
  return `${roomId}:current`;
}

/**
 * Generates a redis key for the last player to move.
 * @param {String} roomId Id of room to generate key for
 * @return {String} Returns redis key for last player.
 */
function getLastPlayerKey(roomId) {
  return `${roomId}:last`;
}

/**
 * Generates and returns redis key for lowest dealt
 * @param {String} roomId Id of room to get loweset dealt from
 * @return {String} Returns the redis key for the lowest card dealt.
 */
function getLowestDealtKey(roomId) {
  return `${roomId}:lowest`;
}

/**
 * Generates and returns a redis key for a player's id by their position.
 * @param {*} roomId Id of room to get player for
 * @param {*} position Player's playing position (1, 2, 3, 4).
 * @return {String} Returns the redis key for player id at a specific position.
 */
function getPlayerKey(roomId, position) {
  return `${roomId}:player:${position}`;
}

/**
 * Compares two cards to determine if card1 is greater, equal, or less than
 *  card2. Current rules are set that 2 and Ace are highest value with suits
 *  ranking as (H)earts ♥, (D)iamonds ♦, (C)lubs ♣, (S)pades ♠.
 * @param {String} card1 A card in string form being compared
 * @param {String} card2 A card in string form being compared
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
 * Checks if all cards provided share same number value. Used to check if cards
 *  are pairs or triples.
 * @param {Array<String>} cards Cards to check if they share same value
 * @return {Boolean} Returns a boolean indicating if all cards share the same
 *  value.
 */
function areSameValue(cards) {
  const firstCard = parseInt(cards[0].substring(1), 10);
  let sameValue = true;

  // Compare each card's value to determine if they share the same value
  cards.forEach(card => {
    const value = parseInt(card.substring(1), 10);

    if (firstCard !== value) sameValue = false;
  });

  return sameValue;
}

/**
 * Determine if cards to be played are a run and returns a numerical value
 *  depending on the type of run.
 * @param {Array<String>} cards Array of sorted cards to check if they are a run
 * @return {Number} Returns a number indicating the type of run the cards have.
 *  0 for no run, 1 for run of singles, 2 for run of pairs, 3 for run of triples.
 */
function typeOfRun(cards) {
  if (cards.length < 3) return 0; // Run has to have more than 3 cards

  const values = cards.map(card =>
    parseInt(card.substring(1), 10) < 3
      ? parseInt(card.substring(1), 10) + 13
      : parseInt(card.substring(1), 10)
  );
  const lowestValue = values[0];
  let runLength = 0; // 1 for signles, 2 for pairs, 3 for triples
  let runType; // Type of run depending on testing

  // Detemine if run is singles, pairs, or triples
  while (values[0] === values[runLength]) runLength += 1;
  runType = runLength;

  // Compare cards according to type of run
  for (let i = 0; i < values.length; i += runLength) {
    for (let k = i; k < i + runLength; k += 1) {
      if (values[k] !== lowestValue + i / runLength) runType = 0;
    }
  }

  return runType;
}

/**
 * Compares all cards to find and return the lowest ranked card.
 * @param {Array<String>} cards Array of cards to find the lowest in
 * @return {String} Returns lowest cards in provided cards.
 */
function getLowestCard(cards) {
  let lowest = cards[0];

  // Compare each card in cards to previous lowest
  cards.forEach(card => {
    if (compareCards(lowest, card) === 1) {
      lowest = card;
    }
  });

  return lowest;
}

/**
 * Determines the type of cards provided and returns an integer representation.
 * @param {Array<String>} cards Cards to determine combination for
 * @return {Number} Returns a number indicating what type of combination the
 *  cards are: 0 for invlaid type, 1 for singles, 2 for pair, 3 for triple,
 *  4 for run of singles, 5 for run of pairs, 6 for run of triples,
 *  and 7 for 4 of a kind.
 */
function determineCombination(cards) {
  switch (cards.length) {
    case 1: // Can only be singles
      return 1;

    case 2: // Can only be pairs
      return areSameValue(cards) ? 2 : 0;

    case 3:
      // Test for triple
      if (areSameValue(cards)) return 3;

      // Test for a run
      if (typeOfRun(cards)) return 4;

      return 0;

    case 4: // Can only be 4 of a kind
      return areSameValue(cards) ? 7 : 0;

    default:
      // More than 4 can only be a run
      const runType = typeOfRun(cards);

      if (runType === 1) return 4;
      if (runType === 2) return 5;
      if (runType === 3) return 6;
      return 0;
  }
}

/**
 * Connect to redis
 * @param {String} HOST Host of redis server to connect to
 * @param {Number} PORT Port of redis server to connect to
 * @return {Promise<>} Returns a promise to resolve when connection to
 *  redis server is made.
 */
exports.setupRedis = (HOST = 'localhost', PORT = 6379) => {
  return new Promise((res, rej) => {
    redisClient = redis.createClient(PORT, HOST);

    redisClient.on('ready', () => {
      // Require redis server to be version 5+
      if (redisClient.server_info.versions[0] < 5)
        return rej(new Error('Server requires redis server version >= 5'));

      return res(redisClient);
    });
  });
};

exports.compareCards = compareCards;

/**
 *
 * @param {*} roomId
 * @param {*} players
 * @param {*} playerCount
 * @param {*} testDeck
 * @param {*} testHands
 * @param {*} testLowest
 */
exports.initGame = async (
  roomId,
  players,
  playerCount,
  testDeck = null,
  testHands = null,
  testLowest = null
) => {
  const lows = []; // Stores the lowest card from each hand
  // Clear old game data
  await Promise.all([
    redisClient.delAsync(getDeckKey(roomId), 52),
    redisClient.delAsync(getBoardKey(roomId), 52),
    redisClient.delAsync(getHandKey(roomId, 1), 52),
    redisClient.delAsync(getHandKey(roomId, 2), 52),
    redisClient.delAsync(getHandKey(roomId, 3), 52),
    redisClient.delAsync(getHandKey(roomId, 4), 52),
    redisClient.delAsync(getTopKey(roomId)),
    redisClient.delAsync(getBoardTypeKey(roomId)),
    redisClient.delAsync(getCurrentPlayerKey(roomId)),
    redisClient.delAsync(getLastPlayerKey(roomId))
  ]);

  // If test data provided, use that instead
  await redisClient.saddAsync(getDeckKey(roomId), testDeck || deck);

  for (let player = 1; player <= playerCount; player++) {
    const cards =
      testHands && testHands[player - 1]
        ? testHands[player - 1]
        : await redisClient.spopAsync(getDeckKey(roomId), 5);

    await Promise.all([
      redisClient.saddAsync(getHandKey(roomId, player), cards),
      redisClient.setAsync(getPlayerKey(roomId, player), players[player - 1])
    ]);

    // Get lowest card from each hand
    lows.push(getLowestCard(cards));
  }

  const lowestDealt = testLowest || getLowestCard(lows); // Find lowest dealt
  return redisClient.setAsync(getLowestDealtKey(roomId), lowestDealt);
};

/**
 *
 * @param {String} gameId Id of game to that player is in
 * @param {Number} player Player to get hand for
 */
exports.getPlayerHand = (gameId, player) => {
  return redisClient.smembersAsync(getHandKey(gameId, player));
};

/**
 *
 * @param {String} gameId
 * @return {Promise<Array>} Returns an array of promises
 */
exports.getAllHands = gameId => {
  return Promise.all([
    redisClient.smembersAsync(getHandKey(gameId, 1)),
    redisClient.smembersAsync(getHandKey(gameId, 2)),
    redisClient.smembersAsync(getHandKey(gameId, 3)),
    redisClient.smembersAsync(getHandKey(gameId, 4))
  ]);
};

/**
 *
 * @param {String} gameId
 * @return {Promise<Object>} Returns a promise
 */
exports.getBoard = gameId => {
  return redisClient.smembersAsync(getBoardKey(gameId));
};

/**
 *
 * @param {*} gameId
 * @param {*} cardsToPlay
 * @param {*} player
 */
exports.playCards = async (gameId, cardsToPlay, player) => {
  // Get top card, current & last player
  let [topCard, currentPlayer, boardType] = await Promise.all([
    redisClient.getAsync(getTopKey(gameId)),
    redisClient.getAsync(getCurrentPlayerKey(gameId)),
    redisClient.getAsync(getBoardTypeKey(gameId))
  ]);

  // First card(s) played must be lowest
  if (!currentPlayer) {
    const lowest = await redisClient.getAsync(getLowestDealtKey(gameId));

    if (!cardsToPlay.includes(lowest)) {
      return 0;
    }
    currentPlayer = player;
  } else if (currentPlayer != player) {
    return 0;
  }

  // Compare board type to hand type
  const handType = determineCombination(cardsToPlay);
  if (handType === 0 || (topCard && handType != boardType && handType !== 7)) {
    return false; // Invalid hand type
  }

  // If no player played last, then must be lowest card in all hands
  if (
    !topCard ||
    compareCards(cardsToPlay[cardsToPlay.length - 1], topCard) === 1
  ) {
    const multi = redisClient.multi();

    // Move cards from player's hands to board using redis transactions
    cardsToPlay.forEach(card => {
      multi.smove(getHandKey(gameId, player), getBoardKey(gameId), card);
    });

    const validMove = await multi.execAsync();

    // If move was made, update game state
    if (!validMove.includes(0)) {
      const nextPlayer = (parseInt(currentPlayer, 10) % 4) + 1;

      return Promise.all([
        redisClient.setAsync(getBoardTypeKey(gameId), handType),
        redisClient.setAsync(getCurrentPlayerKey(gameId), nextPlayer),
        redisClient.setAsync(getLastPlayerKey(gameId), player),
        redisClient.setAsync(
          getTopKey(gameId),
          cardsToPlay[cardsToPlay.length - 1]
        )
      ]);
    }

    return 0;
  }

  return 0;
};

exports.passTurn = async (gameId, player) => {
  // Check if player is current player
  const [currentPlayer, lastPlayer] = await Promise.all([
    redisClient.getAsync(getCurrentPlayerKey(gameId)),
    redisClient.getAsync(getLastPlayerKey(gameId))
  ]);
  const nextPlayer = (currentPlayer % 4) + 1;

  // Only allow current player to pass their turn
  if (currentPlayer != player) {
    return false;
  }

  // Reset board after all players have passed
  if (currentPlayer == lastPlayer) {
    return Promise.all([
      redisClient.spopAsync(getBoardKey(gameId), 52),
      redisClient.delAsync(getTopKey(gameId)),
      redisClient.delAsync(getLastPlayerKey(gameId)),
      redisClient.delAsync(getBoardTypeKey(gameId))
    ]);
  }

  // Set current play to next player
  return redisClient.setAsync(getCurrentPlayerKey(gameId), nextPlayer);
};

/**
 *
 * @param {String} gameId
 * @return {Promise<Object>} Returns a promise to resolve
 */
exports.getLowest = gameId => {
  return redisClient.getAsync(getLowestDealtKey(gameId));
};

/**
 *
 * @param {String} gameId
 * @return {Promise<Object>} Returns a promise that resolve with
 */
exports.getCurrentPlayer = gameId => {
  return redisClient.getAsync(getCurrentPlayerKey(gameId));
};

/**
 *
 * @param {String} gameId
 * @return {}
 */
exports.getLastPlayer = gameId => {
  return redisClient.getAsync(getLastPlayerKey(gameId));
};

exports.getPlayerPosition = (gameId, pos) =>
  redisClient.getAsync(getPlayerKey(gameId, pos));
