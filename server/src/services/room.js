const Room = require('../models/room');

/**
 * Creates a room.
 * @param
 * @return {Promise<Object>} A promise to resolve with the new room object, or
 *  reject if an error occurs.
 */
exports.createRoom = () => {
  return Room({}).save();
};

/**
 * Finds and deletes a room.
 * @param {String} id Id of room to delete
 * @return {Promise} A promise to resolve with the deleted room object, or
 *  reject if an error occurs.
 */
exports.deleteRoom = id => {
  return Room.findByIdAndDelete(id).exec();
};

/**
 * Finds and updates a room to be marked as completed.
 * @param {String} id Id of room to mark as completed
 * @return {Promise<Object>} A promise to resolve with the updated room, or
 *  reject if an error occurs.
 */
exports.markRoomCompleted = id => {
  Room.findByIdAndUpdate(id, { completed: true }).exec();
};

/**
 * Gets and returns a room by it's id.
 * @param {String} id Id of room to serach for
 * @return {Promise<Object>} A promise to resolve with room object if found, or
 *  null if no rooms match. Will reject with error due to mongoose.
 */
exports.getRoomById = id => {
  return Room.findById(id).exec();
};
