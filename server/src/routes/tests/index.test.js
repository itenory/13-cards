const http = require('http');
const request = require('supertest');
const app = require('../../services/app');
const { createRoom } = require('../../services/room');
require('dotenv').config();
const {
  connectDatabase,
  disconnectDatabase
} = require('../../services/database');

const server = http.createServer(app);

beforeAll(async () => {
  await connectDatabase(process.env.DB_URI);
});

afterAll(async () => {
  await disconnectDatabase();
});

/**
 * Sends a request to the app to create a new room.
 * @return {Promise} A promise to resolve or reject on server response.
 */
function createGameRoute() {
  return request(app).post('/create/room');
}

/**
 * Sends a request to the app to get data for a room by it's id.
 * @param {String} roomId Id of room to get data for
 * @return {Promise} A promise to resolve or reject on server response.
 */
function getGameRoute(roomId) {
  return request(app).get(`/game/${roomId}/data`);
}

describe('Game routes', () => {
  test('Successfully create game request returns a roomId', async () => {
    await createGameRoute()
      .expect(200)
      .then(res => {
        expect(res.body.roomId).toBeDefined();
      });
  });

  test('Successful get game request returns JSON object', async () => {
    let roomId;

    // Create a new game to try and get data for
    await createGameRoute().then(res => {
      roomId = res.body.roomId;
    });

    await getGameRoute(roomId)
      .expect(200)
      .then(res => {
        expect(typeof res.body).toBe('object');

        const { _id: id, completed } = res.body;
        // Check data in game
        expect(id).toBe(roomId);
        expect(completed).toBe(false);
      });
  });

  test('Attempting to get invalid roomId data returns 500 Error', async () => {
    await getGameRoute('1').expect(500);
  });
});
