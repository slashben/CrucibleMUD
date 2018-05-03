'use strict';

module.exports = {
  // used by mob prototype
  socketInRoom(roomId, socketId) {
    const ioRoom = global.io.sockets.adapter.rooms[roomId];
    return !!(ioRoom && socketId in ioRoom.sockets);
  },

  // method for sending a message to all players in a room, except one.
  // using the receiver's socket instead of relying on the "sender" socket.
  roomMessage(roomId, message, exclude) {
    const ioRoom = global.io.sockets.adapter.rooms[roomId];
    if (!ioRoom) return;
    for (let socketId in ioRoom.sockets) {
      if (Array.isArray(exclude) && exclude.includes(socketId)) continue;
      const socket = global.io.sockets.connected[socketId];
      if (!socket) continue;
      socket.emit('output', { message: message });
    }
  },

  getSocketByUsername: (username) => {
    for (let socketId in global.io.sockets.connected) {
      let socket = global.io.sockets.connected[socketId];
      if (socket.user && socket.user.username.toLowerCase() == username.toLowerCase()) {
        return socket;
      }
    }
    return null;
  },

  getSocketByUserId: (userId) => {
    for (let socketId in global.io.sockets.connected) {
      let socket = global.io.sockets.connected[socketId];
      if (socket.user && socket.user.id == userId) {
        return socket;
      }
    }
    return null;
  },

  getRoomSockets: (roomId) => {
    const ioRoom = global.io.sockets.adapter.rooms[roomId];
    if (!ioRoom) return [];
    return Object.keys(ioRoom.sockets).map((socketId) => global.io.sockets.connected[socketId]);
  },
};



