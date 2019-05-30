const {
  setupRedis,
  initGame,
  getAllHands,
  getLowest,
  compareCards,
  getPlayerHand,
  playCards,
  getBoard,
  getCurrentPlayer,
  getLastPlayer,
  passTurn
} = require('../redis');

let redisClient;

beforeAll(async () => {
  redisClient = await setupRedis(
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
 * @param {String} roomId Id of the room to search for
 * @return {Object} Returns the lowest card dealt as well as the player who
 *  holds that card.
 */
async function lowestDealtInRoom(roomId) {
  const lowestCardDealt = await getLowest(roomId);
  const hands = await getAllHands(roomId);
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
  test('Initialize with 4 players', async () => {
    const roomId = '1';
    const playerCount = '4';

    await initGame(roomId, playerCount);
  });

  test('Initialize with < 4 players', async () => {
    const roomId = '2';
    const playerCount = '3';

    await initGame(roomId, playerCount);
  });

  test('Lowest card is correctly stored', async () => {
    const roomId = '101';
    const playerCount = 4;

    // Init Game Board
    await initGame(roomId, playerCount);

    // Get lowest card dealt and all hands
    const hands = await getAllHands(roomId);
    const lowestDealt = await getLowest(roomId);

    expect(lowestDealt).toBeDefined();

    // Check if lowest card is acutally lowest
    let trulyLowest = true;

    hands.forEach(hand => {
      hand.forEach(card => {
        if (compareCards(lowestDealt, card) === 1) {
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

  // Initialize a new game each test
  beforeEach(async () => {
    await initGame(roomId, playerCount);
  });

  test('Player hand return as array with 5 cards', async () => {
    const playerHand = await getPlayerHand(roomId, 1);

    expect(playerHand).toBeDefined();
    expect(Array.isArray(playerHand)).toBeTruthy();
    expect(playerHand).toHaveLength(5);
  });

  test('Fourth player hand returns empty array with 3 players', async () => {
    const playerHand = await getPlayerHand(roomId, 4);

    expect(playerHand).toBeDefined();
    expect(Array.isArray(playerHand)).toBeTruthy();
    expect(playerHand).toHaveLength(0);
  });

  test('Getting all player hands returns 2D array', async () => {
    const hands = await getAllHands(roomId);

    expect(hands).toBeDefined();
    expect(Array.isArray(hands)).toBeTruthy();
    expect(hands).toHaveLength(4);
    expect(hands[0]).toHaveLength(5);
  });
});

describe('Playing single cards', () => {
  const roomId = '5';
  const playerCount = '4';

  // Initialize a new game each test
  beforeEach(async () => {
    await initGame(roomId, playerCount);
  });

  // Clear database between runs
  afterEach(async () => {
    await redisClient.flushallAsync();
  });

  test('Playing card not in playerhand returns 0', async () => {
    const results = await playCards(roomId, ['A'], 1);

    expect(results).toBeFalsy();
  });

  test('Playing any card results in board change', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(roomId);

    const result = await playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const board = await getBoard(roomId);

    // Board has only the card that was played
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBeTruthy();
    expect(board).toHaveLength(1);
    expect(board.includes(firstCard)).toBeTruthy();
  });

  test('Playing a card changes current and last player', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(roomId);
    const secondPlayer = (firstPlayer % 4) + 1;

    const result = await playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const [currentPlayer, lastPlayer] = await Promise.all([
      getCurrentPlayer(roomId),
      getLastPlayer(roomId)
    ]);

    // Current player should be next player
    expect(parseInt(currentPlayer, 10)).toBe(secondPlayer);

    // Last player should be the first player to play
    expect(parseInt(lastPlayer, 10)).toBe(firstPlayer);
  });

  test('Playing a card with a card on board', async () => {
    // Find lowest card to dealt
    const [firstCardToPlay, firstPlayer] = await lowestDealtInRoom(roomId);
    const hands = await getAllHands(roomId);
    const secondPlayer = (firstPlayer % 4) + 1;
    const secondCardToPlay = hands[secondPlayer - 1][0];

    // Play first card
    const firstCardResult = await playCards(
      roomId,
      [firstCardToPlay],
      firstPlayer
    );
    expect(firstCardResult).toBeTruthy();

    // Play Second card
    const secondCardResult = await playCards(
      roomId,
      [secondCardToPlay],
      secondPlayer
    );
    expect(secondCardResult).toBeTruthy();

    // Board state
    const board = await getBoard(roomId);
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBeTruthy();
    expect(board).toHaveLength(2);

    // Board has both cards
    expect(board.includes(firstCardToPlay)).toBeTruthy();
    expect(board.includes(secondCardToPlay)).toBeTruthy();

    const [currentPlayer, lastPlayer] = await Promise.all([
      getCurrentPlayer(roomId),
      getLastPlayer(roomId)
    ]);

    expect(parseInt(currentPlayer, 10)).toBe((secondPlayer % 4) + 1);
    expect(parseInt(lastPlayer, 10)).toBe(secondPlayer);
  });
});

describe('Playing multiple cards', () => {
  const roomId = '10';
  const playerCount = 4;

  const testHands = [
    ['S3', 'D3', 'H3', 'C3', 'S4', 'D4', 'H4', 'S5', 'D5', 'H5', 'S6', 'S7'],
    ['S10', 'D10', 'C10', 'H10', 'S11', 'S12', 'S13', 'S1', 'S2']
  ];

  // Initialize a new game with test data
  beforeEach(async () => {
    await initGame(roomId, playerCount, null, testHands, 'S3');
  });

  // Clear database between runs
  afterEach(async () => {
    await redisClient.flushallAsync();
  });

  describe('Playing pairs', () => {
    test('Valid Pair', async () => {
      const cardsToPlay = ['S3', 'D3'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      // Both cards were moved to board and were removed from hand
      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
      expect(playerHands[0].includes('S3')).toBeFalsy();
      expect(board).toHaveLength(2);

      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Invalid pair', async () => {
      const result = await playCards(roomId, ['S3', 'S4'], 1);
      expect(result).toBeFalsy();

      // No cards were add to board
      const board = await getBoard(roomId);
      expect(board).toHaveLength(0);

      // Both cards are still in players hand
      const playerHands = await getAllHands(roomId);
      expect(playerHands[0].includes('S3')).toBeTruthy();
      expect(playerHands[0].includes('S4')).toBeTruthy();
    });
  });

  describe('Playing triples', () => {
    test('Valid triple', async () => {
      const cardsToPlay = ['S3', 'D3', 'H3'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      // All three cards were moved to board and were removed from hand
      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
      expect(board).toHaveLength(3); // Board should have 3 cards

      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Invalid triple', async () => {
      const result = await playCards(roomId, ['S3', 'S4', 'H3'], 1);
      expect(result).toBeFalsy();

      // All three cards were moved to board
      const board = await getBoard(roomId);
      expect(board).toHaveLength(0);

      // All three cards were removed from hand
      const playerHands = await getAllHands(roomId);
      expect(playerHands[0].includes('S3')).toBeTruthy();
      expect(playerHands[0].includes('S4')).toBeTruthy();
      expect(playerHands[0].includes('H3')).toBeTruthy();
    });
  });

  describe('Playing runs', () => {
    test('Valid run of singles', async () => {
      const cardsToPlay = ['S3', 'S4', 'S5'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      // All three cards put on board and removed from player's hand
      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
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
      const firstResult = await playCards(roomId, firstRunToPlay, 1);
      expect(firstResult).toBeTruthy();

      const secondResult = await playCards(roomId, secondRunToPlay, 2);
      expect(secondResult).toBeTruthy();

      // All cards were placed on board and removed from players hand
      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
      expect(board).toHaveLength(6);

      firstRunToPlay.concat(secondRunToPlay).forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
        expect(playerHands[1].includes(card)).toBeFalsy();
      });
    });

    test('Valid run of pairs', async () => {
      const cardsToPlay = ['S3', 'D3', 'S4', 'D4', 'S5', 'D5'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
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
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
      expect(board).toHaveLength(9);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('Playing pairs on a board of singles results in false', async () => {
      const cardsToPlay = ['S10', 'D10'];
      const singleResult = await playCards(roomId, ['S3'], 1);
      expect(singleResult).toBeTruthy();

      // Play a pair after a single card
      const pairResult = await playCards(roomId, cardsToPlay, 2);
      expect(pairResult).toBeFalsy();
    });

    test('Invalid run of singles skipping a value', async () => {
      const cardsToPlay = ['S3', 'S4', 'S6'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });

    test('Invalid run of pairs', async () => {
      const cardsToPlay = ['S3', 'D3', 'S4', 'D4'];
      const result = await playCards(roomId, cardsToPlay, 1);
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
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });

    test('Invalid run of mixed ', async () => {
      const cardsToPlay = ['S3', 'D3', 'S4', 'D4', 'S5', 'D5', 'H5'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });
  });

  describe('Playing 4 of a kind', () => {
    test('Valid 4 of a kind', async () => {
      const cardsToPlay = ['S3', 'D3', 'H3', 'C3'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeTruthy();

      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
      expect(board).toHaveLength(4);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('4 of a kind can be played on any board type', async () => {
      const cardsToPlay = ['S10', 'D10', 'H10', 'C10'];
      const singleResult = await playCards(roomId, ['S3'], 1);
      expect(singleResult).toBeTruthy();

      const result = await playCards(roomId, cardsToPlay, 2);
      expect(result).toBeTruthy();

      const board = await getBoard(roomId);
      const playerHands = await getAllHands(roomId);
      expect(board).toHaveLength(5);

      // All cards are on board and all cards removed from player's hand
      cardsToPlay.forEach(card => {
        expect(board.includes(card)).toBeTruthy();
        expect(playerHands[0].includes(card)).toBeFalsy();
      });
    });

    test('3 of a kind results in no change', async () => {
      const cardsToPlay = ['S4', 'D3', 'H3', 'C3'];
      const result = await playCards(roomId, cardsToPlay, 1);
      expect(result).toBeFalsy();
    });
  });
});

describe('Passing turn', () => {
  const roomId = '6';
  const playerCount = '4';

  // Initialize a new game each test
  beforeEach(async () => {
    await initGame(roomId, playerCount);
  });

  // Clear database between runs
  afterEach(async () => {
    await redisClient.flushallAsync();
  });

  test('No player can pass the first turn', async () => {
    const results = await Promise.all([
      passTurn(roomId, 1),
      passTurn(roomId, 2),
      passTurn(roomId, 3),
      passTurn(roomId, 4)
    ]);

    expect(results[0]).toBeFalsy();
    expect(results[1]).toBeFalsy();
    expect(results[2]).toBeFalsy();
    expect(results[3]).toBeFalsy();
  });

  test('Passing turn not as current player results in false', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(roomId);

    const result = await playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const currentPlayer = await getCurrentPlayer(roomId);

    // Test passing turn with all players beside last
    for (let i = 1; i <= 4; i += 1) {
      if (i != currentPlayer) {
        const passResult = await passTurn(roomId, i);
        expect(passResult).toBeFalsy();
      }
    }
  });

  test('Passing turn should set increment current player', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(roomId);
    const playerToPass = (firstPlayer % 4) + 1;

    const result = await playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    const passResult = await passTurn(roomId, playerToPass);
    expect(passResult).toBeTruthy();

    const [currentPlayer, lastPlayer] = await Promise.all([
      getCurrentPlayer(roomId),
      getLastPlayer(roomId)
    ]);

    // Check that last player is correct and current was moved up one
    expect(parseInt(lastPlayer, 10)).toBe(firstPlayer);
    expect(parseInt(currentPlayer, 10)).toBe((playerToPass % 4) + 1);
  });

  test('All players passing turn resets the board', async () => {
    const [firstCard, firstPlayer] = await lowestDealtInRoom(roomId);
    const firstToPass = (firstPlayer % 4) + 1;
    const secondToPass = (firstToPass % 4) + 1;
    const thirdToPass = (secondToPass % 4) + 1;

    const result = await playCards(roomId, [firstCard], firstPlayer);
    expect(result).toBeTruthy();

    // Skip the next 3 turns, must happen in order
    await passTurn(roomId, firstToPass);
    await passTurn(roomId, secondToPass);
    await passTurn(roomId, thirdToPass);
    await passTurn(roomId, firstPlayer);

    // Get current and last player
    const [currentPlayer, lastPlayer] = await Promise.all([
      getCurrentPlayer(roomId),
      getLastPlayer(roomId)
    ]);

    const board = await getBoard(roomId);

    expect(board).toBeDefined();
    expect(board).toHaveLength(0);
    expect(parseInt(currentPlayer, 10)).toBe(firstPlayer);
    expect(lastPlayer).toBeNull();
  });
});
