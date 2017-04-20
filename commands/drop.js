'use strict';

const roomManager = require('../roomManager');

module.exports = {
  name: 'drop',

  patterns: [
    /^drop\s+(.+)$/i,
    /^drop/i
  ],

  dispatch(socket, match) {
    console.log(match);
    if (match.length < 2) {
      socket.emit('output', { message: 'What do you want to drop?' });
      return;
    }
    module.exports.execute(socket, match[1]);
  },

  execute(socket, itemName) {
    roomManager.getRoomById(socket.user.roomId, (room) => {

      // autocomplete name
      const itemNames = socket.user.inventory.map(item => item.displayName);
      const resolvedNames = global.ResolveName(socket, itemName, itemNames);
      if(resolvedNames.length === 0) {
        socket.emit('output', { message: 'You don\'t seem to be carrying that.' });
        return;
      } else if(resolvedNames.length > 1) {
        // todo: possibly print out a list of the matches
        socket.emit('output', { message: 'Not specific enough!' });
        return;
      }

      console.log(`Auto completed name: ${resolvedNames[0]}`);

      const item = socket.user.inventory.find(item => item.displayName === resolvedNames[0]);

      // take the item from the user
      const index = socket.user.inventory.indexOf(item);
      socket.user.inventory.splice(index, 1);
      socket.user.save();

      // todo: remove after a bit. just a workaround for old data.
      if (!room.inventory) room.inventory = [];

      // and place it in the room
      room.inventory.push(item);
      room.save();

      socket.emit('output', { message: 'Dropped.' });
      socket.broadcast.to(socket.user.roomId).emit('output', { message: `${socket.user.username} drops ${item.name}.` });
    });

  },

  help() { },

};