'use strict';

const roomManager = require('../roomManager');

module.exports = {
  name: 'attack',

  patterns: [
    /a\s+(.+)$/i,
    /attack\s+(.+)$/i,
  ],

  dispatch(socket, match) {
    module.exports.execute(socket, match[1]);
  },

  execute(socket, targetName) {
    console.log(`Trying to attack the: ${targetName}`);

    roomManager.getRoomById(socket.user.roomId, function(room) {

      // autocomplete name
      const mobNames = room.mobs.map(mob => mob.displayName);
      const resolvedNames = global.ResolveName(socket, targetName, mobNames);
      if(resolvedNames.length === 0) {
        socket.emit("output", { message: "You don't see that here!" });
        return;
      } else if(resolvedNames.length > 1) {
        // todo: possibly print out a list of the matches
        socket.emit('output', { message: 'Not specific enough!' });
        return;
      }

      console.log(`Auto completed name: ${resolvedNames[0]}`);

      const target = room.mobs.find(mob => mob.displayName === resolvedNames[0]);

      socket.user.attackTarget = target.id;
      socket.user.attackInterval = 4000;

      socket.emit('output', { message: '<span class="olive">*** Combat Engaged ***</span>' });
      socket.broadcast.to(room.id).emit('output', { message: `${socket.user.username} moves to attack ${resolvedNames[0]}!` });
    });

  },

  help() {},
};