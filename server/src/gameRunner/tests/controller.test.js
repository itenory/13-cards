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

describe('Playing cards', () => {
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
    const results = await runner.playCard(roomId, 'A', 1);

    expect(results).toBeFalsy();
  });

  test('Playing any card results in board change', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(runner, roomId);

    const result = await runner.playCard(roomId, firstCard, firstPlayer);
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

    const result = await runner.playCard(roomId, firstCard, firstPlayer);
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
    const firstCardResult = await runner.playCard(
      roomId,
      firstCardToPlay,
      firstPlayer
    );
    expect(firstCardResult).toBeTruthy();

    // Play Second card
    const secondCardResult = await runner.playCard(
      roomId,
      secondCardToPlay,
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

    const result = await runner.playCard(roomId, firstCard, firstPlayer);
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

    const result = await runner.playCard(roomId, firstCard, firstPlayer);
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

    const result = await runner.playCard(roomId, firstCard, firstPlayer);
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
