const {
  createRoomRoute,
  getRoomData
} = require('../controllers/roomController');

/**
 * Sets app to use routers.
 * @param {Object} app Express app
 */
module.exports = function setUpRouters(app) {
  app.post('/create/room', createRoomRoute);

  app.get('/game/:roomId/data', getRoomData);

  // Error handler
  app.use((err, req, res, next) => {
    if (err) {
      return res
        .status(err.status || 500)
        .send(err.msg || 'Server error. Please try again');
    }

    res.status(500).send('Server error. Please try again.');
  });
};
