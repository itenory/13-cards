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
  if (redisClient) redisClient.quit();
});

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

  test('Playing card not in playerhand returns 0', async () => {
    const results = await runner.playCard(roomId, 'A', 1);

    expect(results).toBeFalsy();
  });

  test('Playing any card results in board change', async () => {
    const hand = await runner.getPlayerHand(roomId, 1);
    const cardToPlay = hand[0];

    const result = await runner.playCard(roomId, cardToPlay, 1);
    expect(result).toBeTruthy();

    const board = await runner.getBoard(roomId);
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBeTruthy();
    expect(board).toHaveLength(1);
    expect(board.includes(cardToPlay)).toBeTruthy();
  });

  test('Playing a card with a card on board', async () => {
    const player = 1;
    const hand = await runner.getPlayerHand(roomId, player);
    let firstCardToPlay;
    let secondCardToPlay;

    // Make sure second card is less than first card
    if (runner.compareCards(hand[0], hand[1]) === -1) {
      firstCardToPlay = hand[0];
      secondCardToPlay = hand[1];
    } else {
      firstCardToPlay = hand[1];
      secondCardToPlay = hand[0];
    }

    const firstResult = await runner.playCard(roomId, firstCardToPlay, player);
    expect(firstResult).toBeTruthy();

    const result = await runner.playCard(roomId, secondCardToPlay, player);
    expect(result).toBeTruthy();

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

    expect(parseInt(currentPlayer, 10)).toBe((player + 1) % 4);
    expect(parseInt(lastPlayer, 10)).toBe(player);
  });
});
