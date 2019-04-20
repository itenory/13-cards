const { createRoom, getRoomById } = require('../services/room');

/**
 * Route handler for creating a new game room.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function to be called
 */
exports.createRoomRoute = (req, res, next) => {
  createRoom()
    .then(room => {
      res.json({
        roomId: room.id
      });
    })
    .catch(err => next(err));
};

/**
 * Route handler for getting room data.
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function to be called
 */
exports.getRoomData = (req, res, next) => {
  const { roomId } = req.params;

  getRoomById(roomId)
    .then(room => {
      if (!room) return res.status(500).send('No room found');

      res.json(room);
    })
    .catch(next);
};
