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
      })
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
  })

  test('Playing card not in playerhand returns 0', async () => {
    const results = await runner.playCard(roomId, 'A', 1);

    expect(results).toBeFalsy();
  });

  test('Playing any card results in board change', async () => {  
    // Find lowest card to dealt
    const cardToPlay = await runner.getLowest(roomId);
    const hands = await runner.getAllHands(roomId);
    let player;
    
    hands.forEach((hand, index) => {
      if (hand.includes(cardToPlay)) {
        player = index + 1;
      }
    });


    const result = await runner.playCard(roomId, cardToPlay, player);
    expect(result).toBeTruthy();

    const board = await runner.getBoard(roomId);
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBeTruthy();
    expect(board).toHaveLength(1);
    expect(board.includes(cardToPlay)).toBeTruthy();
  });

  test('Playing a card with a card on board', async () => {
    // Find lowest card to dealt
    const lowestCardDealt = await runner.getLowest(roomId);
    const hands = await runner.getAllHands(roomId);
    let player; // Player who holds lowest dealt card
    let nextPlayer;
    let firstCardToPlay;
    let secondCardToPlay;
    let indexNextCard = 0;

    // Determine which player has the lowest card
    hands.forEach((hand, index) => {
      if (hand.includes(lowestCardDealt)) {
        player = index + 1;
        nextPlayer = (player % 4) + 1;
      }
    });

    // Lowest card dealt and any card from next player
    firstCardToPlay = lowestCardDealt;
    secondCardToPlay = hands[nextPlayer-1][0];

    // Play first card
    const firstCardResult = await runner.playCard(roomId, firstCardToPlay, player);
    expect(firstCardResult).toBeTruthy();

    // Play Second card
    const secondCardResult = await runner.playCard(roomId, secondCardToPlay, nextPlayer);
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

    expect(parseInt(currentPlayer, 10)).toBe((nextPlayer + 1) % 4);
    expect(parseInt(lastPlayer, 10)).toBe(nextPlayer);
  });
});
