'use strict';

const roomManager = require('../roomManager');
const Room = require('../models/room');

module.exports = {
  name: 'create',
  admin: true,

  patterns: [
    /^create\s+(room)\s+(\w+)$/i,
    /^create\s+(door)\s+(\w+)$/i,
  ],

  dispatch(socket, match) {
    const type = match[1].toLowerCase();
    const param = match[2];
    module.exports.execute(socket, type, param);
  },

  execute(socket, type, param) {
    const room = roomManager.getRoomById(socket.user.roomId);
    if (type === 'room') {
      const dir = global.LongToShort(param.toLowerCase());
      if (!global.ValidDirectionInput(dir)) {
        socket.emit('output', { message: 'Invalid direction!' });
        return;
      }
      roomManager.createRoom(room, dir, function () {
        socket.emit('output', { message: 'Room created.' });
        socket.broadcast.to(socket.user.roomId).emit('output', { message: `${socket.user.username} waves his hand and an exit appears to the ${Room.exitName(dir)}!` });
      });
    }
    else if (type == 'door') {
      const dir = global.LongToShort(param);
      const exit = room.getExit(dir);

      if (exit) {
        exit.closed = true;
        room.save();
      } else {
        socket.emit('output', { message: 'Invalid direction.' });
        return;
      }
    } else {
      socket.emit('output', { message: 'Invalid create type.' });
      return;
    }
  },

  help(socket) {
    let output = '';
    output += '<span class="mediumOrchid">create room &lt;dir&gt; </span><span class="purple">-</span> Create new room in specified direction.<br />';
    socket.emit('output', { message: output });
  },

};
