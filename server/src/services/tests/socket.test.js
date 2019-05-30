require('dotenv').config();
const http = require('http');
const clientIO = require('socket.io-client');
const setupSocket = require('../socket');
const { connectDatabase, disconnectDatabase } = require('../database');

const PORT = 5001;
const HOST = 'localhost';
const testDB = process.env.DB_URI_TEST;
const server = http.createServer();

let socket;
let clientSocket1;
let clientSocket2;
let clientSocket3;
let clientSocket4;
server.listen(PORT, HOST);

// Set up socket connections
beforeAll(async () => {
  await connectDatabase(testDB);
  socket = setupSocket(server);
});

// Destory server and socket
afterAll(() => {
  disconnectDatabase();
  socket.close();
  server.close();
});

beforeEach(done => {
  let counter = 0;
  // Connect clients
  clientSocket1 = clientIO.connect(`http://${HOST}:${PORT}`, {
    transports: ['websocket']
  });
  clientSocket2 = clientIO.connect(`http://${HOST}:${PORT}`, {
    transports: ['websocket']
  });
  clientSocket3 = clientIO.connect(`http://${HOST}:${PORT}`, {
    transports: ['websocket']
  });
  clientSocket4 = clientIO.connect(`http://${HOST}:${PORT}`, {
    transports: ['websocket']
  });

  clientSocket1.on('connect', () => {
    counter += 1;
    if (counter === 4) done();
  });

  clientSocket2.on('connect', () => {
    counter += 1;
    if (counter === 4) done();
  });

  clientSocket3.on('connect', () => {
    counter += 1;
    if (counter === 4) done();
  });

  clientSocket4.on('connect', () => {
    counter += 1;
    if (counter === 4) done();
  });
});

// Disconnect all client sockets
afterEach(() => {
  if (clientSocket1) clientSocket1.close();
  if (clientSocket2) clientSocket2.close();
  if (clientSocket3) clientSocket3.close();
  if (clientSocket4) clientSocket4.close();
});

describe('', () => {
  test('', () => {});
});
