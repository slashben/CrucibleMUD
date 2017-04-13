'use strict';

const breakCmd = require('./break');
const lookCmd = require('./look');

module.exports = {
  name: 'teleport',

  patterns: [
    /teleport\s+(\w+)$/i,
    /tele\s+(\w+)$/i
  ],

  /*
        if (socket.admin) {
          if (command.length < 2) {
            socket.emit('output', { message: 'Teleport to who?' });
            return;
          }
          Teleport(socket, command[1], () => {
          });
        }
   */

  dispatch(socket, match) {
    module.exports.execute(socket, match[1]);
  },

  execute(socket, username) {
    const userSocket = global.GetSocketByUsername(username);
    if (!userSocket) {
      socket.emit('output', { message: 'Player not found.' });
      return;
    }

    breakCmd.execute(socket);

    socket.leave(socket.user.roomId);
    socket.join(userSocket.user.roomId);
    socket.user.roomId = userSocket.roomId;
    socket.user.save();

    socket.broadcast.to(socket.user.roomId).emit('output', { message: `${socket.user.username} appears out of thin air!` });
    lookCmd.execute(socket);
  },

  help() { },
};
