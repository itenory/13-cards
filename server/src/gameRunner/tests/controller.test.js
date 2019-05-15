require('dotenv').config();
const bluebird = require('bluebird');
const redis = require('redis');
const createController = require('../createController');

// Promisify all redis functions
bluebird.promisifyAll(redis);

/**
 *
 * Game Data keys
 * Game Data keys
 * Game Data keys
 * Game Data keys
 * {roomId}:deck => set
 *
 * // Cards on Board
 * {roomId}:boardDeck => set
 *
 * // Player's Hand
 * {roomId}:player:{playerId} => set
 *
 * // Game State
 *
 *  Current Player
 * {roomId}:current => string
 *
 *  // Current && Last Player; First move flag;
 *
 *
 */

let redisClient;

beforeAll(() => {
  redisClient = redis.createClient(
    process.env.REDIS_PORT,
    process.env.REDIS_HOST
  );
});

afterAll(() => {
  if (redisClient) {
    redisClient.flushall();
    redisClient.quit();
  }
});

/**
 * Gets the lowest card dealt and search through each player's hand to
 *  determine holder.
 * @param {Object} runner Game controll containing functions
 * @param {String} roomId Id of the room to search for
 * @return {Object} Returns the lowest card dealt as well as the player who
 *  holds that card.
 */
async function lowestDealtInRoom(runner, roomId) {
  const lowestCardDealt = await runner.getLowest(roomId);
  const hands = await runner.getAllHands(roomId);
  let player; // Player who holds lowest dealt card

  // Determine which player has the lowest card
  hands.forEach((hand, index) => {
    if (hand.includes(lowestCardDealt)) {
      player = index + 1;
    }
  });

  return [lowestCardDealt, player];
}

describe('Initialize Game', () => {
  test('Initialize with 4 players', () => {
    const roomId = '1';
    const playerCount = '4';

    const runner = createController(redisClient);
    runner.initGame(roomId, playerCount);
  });

  test('Initialize with < 4 players', () => {
    const roomId = '2';
    const playerCount = '3';

    const runner = createController(redisClient);
    runner.initGame(roomId, playerCount);
  });

  test('Lowest card is correctly stored', async () => {
    const roomId = '101';
    const playerCount = 4;

    // Init Game Board
    const runner = createController(redisClient);
    await runner.initGame(roomId, playerCount);

    // Get lowest card dealt and all hands
    const hands = await runner.getAllHands(roomId);
    const lowestDealt = await runner.getLowest(roomId);

    expect(lowestDealt).toBeDefined();

    // Check if lowest card is acutally lowest
    let trulyLowest = true;

    hands.forEach(hand => {
      hand.forEach(card => {
        if (runner.compareCards(lowestDealt, card) === 1) {
          trulyLowest = false;
        }
      });
    });

    expect(trulyLowest).toBeTruthy();
  });
});

describe('Getting player hand', () => {
  const roomId = '3';
  const playerCount = '3';
  let runner;

  // Initialize a new game each test
  beforeEach(async () => {
    runner = createController(redisClient);
    await runner.initGame(roomId, playerCount);
  });

  test('Player hand return as array with 5 cards', async () => {
    const playerHand = await runner.getPlayerHand(roomId, 1);

    expect(playerHand).toBeDefined();
    expect(Array.isArray(playerHand)).toBeTruthy();
    expect(playerHand).toHaveLength(5);
  });

  test('Fourth player hand returns empty array with 3 players', async () => {
    const playerHand = await runner.getPlayerHand(roomId, 4);

    expect(playerHand).toBeDefined();
    expect(Array.isArray(playerHand)).toBeTruthy();
    expect(playerHand).toHaveLength(0);
  });

  test('Getting all player hands returns 2D array', async () => {
    const hands = await runner.getAllHands(roomId);

    expect(hands).toBeDefined();
    expect(Array.isArray(hands)).toBeTruthy();
    expect(hands).toHaveLength(4);
    expect(hands[0]).toHaveLength(5);
  });
});

describe('Playing single cards', () => {
  const roomId = '5';
  const playerCount = '4';
  let runner;

  // Initialize a new game each test
  beforeEach(async () => {
    runner = createController(redisClient);
    await runner.initGame(roomId, playerCount);
  });

  // Clear database between runs
  afterEach(async () => {
    await redisClient.flushallAsync();
  });

  test('Playing card not in playerhand returns 0', async () => {
    const results = await runner.playCards(roomId, ['A'], 1);

    expect(results).toBeFalsy();
  });

  test('Playing any card results in board change', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(runner, roomId);

    const result = await runner.playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const board = await runner.getBoard(roomId);

    // Board has only the card that was played
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBeTruthy();
    expect(board).toHaveLength(1);
    expect(board.includes(firstCard)).toBeTruthy();
  });

  test('Playing a card changes current and last player', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(runner, roomId);
    const secondPlayer = (firstPlayer % 4) + 1;

    const result = await runner.playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const [currentPlayer, lastPlayer] = await Promise.all([
      runner.getCurrentPlayer(roomId),
      runner.getLastPlayer(roomId)
    ]);

    // Current player should be next player
    expect(parseInt(currentPlayer, 10)).toBe(secondPlayer);

    // Last player should be the first player to play
    expect(parseInt(lastPlayer, 10)).toBe(firstPlayer);
  });

  test('Playing a card with a card on board', async () => {
    // Find lowest card to dealt
    const [firstCardToPlay, firstPlayer] = await lowestDealtInRoom(
      runner,
      roomId
    );
    const hands = await runner.getAllHands(roomId);
    const secondPlayer = (firstPlayer % 4) + 1;
    const secondCardToPlay = hands[secondPlayer - 1][0];

    // Play first card
    const firstCardResult = await runner.playCards(
      roomId,
      [firstCardToPlay],
      firstPlayer
    );
    expect(firstCardResult).toBeTruthy();

    // Play Second card
    const secondCardResult = await runner.playCards(
      roomId,
      [secondCardToPlay],
      secondPlayer
    );
    expect(secondCardResult).toBeTruthy();

    // Board state
    const board = await runner.getBoard(roomId);
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBeTruthy();
    expect(board).toHaveLength(2);

    // Board has both cards
    expect(board.includes(firstCardToPlay)).toBeTruthy();
    expect(board.includes(secondCardToPlay)).toBeTruthy();

    const [currentPlayer, lastPlayer] = await Promise.all([
      runner.getCurrentPlayer(roomId),
      runner.getLastPlayer(roomId)
    ]);

    expect(parseInt(currentPlayer, 10)).toBe((secondPlayer % 4) + 1);
    expect(parseInt(lastPlayer, 10)).toBe(secondPlayer);
  });
});

describe('Playing multiple cards', () => {
  const roomId = '10';
  const playerCount = 4;
  let runner;

  const testHands = [
    ['S3', 'D3', 'H3', 'C3', 'S4', 'D4', 'H4', 'S5', 'D5', 'H5', 'S6', 'S7'],
    ['S10', 'D10', 'C10', 'H10', 'S11', 'S12', 'S13', 'S1', 'S2']
  ];

  // Initialize a new game with test data
  beforeEach(async () => {
    runner = createController(redisClient);
    await runner.initGame(roomId, playerCount, null, testHands, 'S3');
  });

  // Clear database between runs
  afterEach(async () => {
    await redisClient.flushallAsync();
  });

  describe('Playing pairs', () => {
    test('Valid Pair', async () => {
      const cardsToPlay = ['S3', 'D3'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      // Both cards were moved to board and were removed from hand
      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(playerHands[0].includes('S3')).toBeFalsy();
      expect(board).toHaveLength(2);

      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Invalid pair', async () => {
      const result = await runner.playCards(roomId, ['S3', 'S4'], 1);
      expect(result).toBeFalsy();

      // No cards were add to board
      const board = await runner.getBoard(roomId);
      expect(board).toHaveLength(0);

      // Both cards are still in players hand
      const playerHands = await runner.getAllHands(roomId);
      expect(playerHands[0].includes('S3')).toBeTruthy();
      expect(playerHands[0].includes('S4')).toBeTruthy();
    });
  });

  describe('Playing triples', () => {
    test('Valid triple', async () => {
      const cardsToPlay = ['S3', 'D3', 'H3'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      // All three cards were moved to board and were removed from hand
      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(3); // Board should have 3 cards

      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Invalid triple', async () => {
      const result = await runner.playCards(roomId, ['S3', 'S4', 'H3'], 1);
      expect(result).toBeFalsy();

      // All three cards were moved to board
      const board = await runner.getBoard(roomId);
      expect(board).toHaveLength(0);

      // All three cards were removed from hand
      const playerHands = await runner.getAllHands(roomId);
      expect(playerHands[0].includes('S3')).toBeTruthy();
      expect(playerHands[0].includes('S4')).toBeTruthy();
      expect(playerHands[0].includes('H3')).toBeTruthy();
    });
  });

  describe('Playing runs', () => {
    test('Valid run of singles', async () => {
      const cardsToPlay = ['S3', 'S4', 'S5'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      // All three cards put on board and removed from player's hand
      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(3); // Board should have only three cards

      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Valid run of singles including Ace and 2', async () => {
      const firstRunToPlay = ['S3', 'S4', 'S5'];
      const secondRunToPlay = ['S13', 'S1', 'S2'];

      // Play a 3 striaght with lowest card
      const firstResult = await runner.playCards(roomId, firstRunToPlay, 1);
      expect(firstResult).toBeTruthy();

      const secondResult = await runner.playCards(roomId, secondRunToPlay, 2);
      expect(secondResult).toBeTruthy();

      // All cards were placed on board and removed from players hand
      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(6);

      firstRunToPlay.concat(secondRunToPlay).forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
        expect(playerHands[1].includes(card)).toBeFalsy();
      });
    });

    test('Valid run of pairs', async () => {
      const cardsToPlay = ['S3', 'D3', 'S4', 'D4', 'S5', 'D5'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(6);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Valid run of triples', async () => {
      const cardsToPlay = [
        'S3',
        'D3',
        'H3',
        'S4',
        'D4',
        'H4',
        'S5',
        'D5',
        'H5'
      ];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(9);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Playing pairs on a board of singles results in false', async () => {
      const cardsToPlay = ['S10', 'D10'];
      const singleResult = await runner.playCards(roomId, ['S3'], 1);
      expect(singleResult).toBeTruthy();

      // Play a pair after a single card
      const pairResult = await runner.playCards(roomId, cardsToPlay, 2);
      expect(pairResult).toBeFalsy();
    });

    test('Invalid run of singles skipping a value', async () => {
      const cardsToPlay = ['S3', 'S4', 'S6'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });

    test('Invalid run of pairs', async () => {
      const cardsToPlay = ['S3', 'D3', 'S4', 'D4'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });

    test('Invalid run of triples', async () => {
      const cardsToPlay = [
        'S3',
        'D3',
        'H3',
        'S4',
        'D4',
        'H4',
        'S5',
        'D5',
        'S6'
      ];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });

    test('Invalid run of mixed ', async () => {
      const cardsToPlay = ['S3', 'D3', 'S4', 'D4', 'S5', 'D5', 'H5'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });
  });

  describe('Playing 4 of a kind', () => {
    test('Valid 4 of a kind', async () => {
      const cardsToPlay = ['S3', 'D3', 'H3', 'C3'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(4);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('4 of a kind can be played on any board type', async () => {
      const cardsToPlay = ['S10', 'D10', 'H10', 'C10'];
      const singleResult = await runner.playCards(roomId, ['S3'], 1);
      expect(singleResult).toBeTruthy();

      const result = await runner.playCards(roomId, cardsToPlay, 2);
      expect(result).toBeTruthy();

      const board = await runner.getBoard(roomId);
      const playerHands = await runner.getAllHands(roomId);
      expect(board).toHaveLength(5);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('3 of a kind results in no change', async () => {
      const cardsToPlay = ['S4', 'D3', 'H3', 'C3'];
      const result = await runner.playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });
  });
});

describe('Passing turn', () => {
  const roomId = '6';
  const playerCount = '4';
  let runner;

  // Initialize a new game each test
  beforeEach(async () => {
    runner = createController(redisClient);
    await runner.initGame(roomId, playerCount);
  });

  // Clear database between runs
  afterEach(async () => {
    await redisClient.flushallAsync();
  });

  test('No player can pass the first turn', async () => {
    const results = await Promise.all([
      runner.passTurn(roomId, 1),
      runner.passTurn(roomId, 2),
      runner.passTurn(roomId, 3),
      runner.passTurn(roomId, 4)
    ]);

    expect(results[0]).toBeFalsy();
    expect(results[1]).toBeFalsy();
    expect(results[2]).toBeFalsy();
    expect(results[3]).toBeFalsy();
  });

  test('Passing turn not as current player results in false', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(runner, roomId);

    const result = await runner.playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const currentPlayer = await runner.getCurrentPlayer(roomId);

    // Test passing turn with all players beside last
    for (let i = 1; i <= 4; i += 1) {
      if (i != currentPlayer) {
        const passResult = await runner.passTurn(roomId, i);
        expect(passResult).toBeFalsy();
      }
    }
  });

  test('Passing turn should set increment current player', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(runner, roomId);
    const playerToPass = (firstPlayer % 4) + 1;

    const result = await runner.playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const passResult = await runner.passTurn(roomId, playerToPass);
    expect(passResult).toBeTruthy();

    const [currentPlayer, lastPlayer] = await Promise.all([
      runner.getCurrentPlayer(roomId),
      runner.getLastPlayer(roomId)
    ]);

    // Check that last player is correct and current was moved up one
    expect(parseInt(lastPlayer, 10)).toBe(firstPlayer);
    expect(parseInt(currentPlayer, 10)).toBe((playerToPass % 4) + 1);
  });

  test('All players passing turn resets the board', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(runner, roomId);
    const firstToPass = (firstPlayer % 4) + 1;
    const secondToPass = (firstToPass % 4) + 1;
    const thirdToPass = (secondToPass % 4) + 1;

    const result = await runner.playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    // Skip the next 3 turns, must happen in order
    await runner.passTurn(roomId, firstToPass);
    await runner.passTurn(roomId, secondToPass);
    await runner.passTurn(roomId, thirdToPass);
    await runner.passTurn(roomId, firstPlayer);

    // Get current and last player
    const [currentPlayer, lastPlayer] = await Promise.all([
      runner.getCurrentPlayer(roomId),
      runner.getLastPlayer(roomId)
    ]);

    const board = await runner.getBoard(roomId);

    expect(board).toBeDefined();
    expect(board).toHaveLength(0);
    expect(parseInt(currentPlayer, 10)).toBe(firstPlayer);
    expect(lastPlayer).toBeNull();
  });
});
