const actionsData = require('../../data/actionData');
const socketUtil = require('../core/socketUtil');
const Room = require('../models/room');
const utils = require('../core/utilities');

module.exports = {
  actionDispatcher(socket, action, username) {
    const targetSocket = username ? socketUtil.getSocketByUsername(username) : null;

    if (action in actionsData.actions) {
      // user is attempting to action another user
      if (username) {
        if (!targetSocket) {
          socket.emit('output', { message: `Unknown user: ${username}` });
          return true;
        }

        if (targetSocket.id === socket.id) {
          // if a user has tried to do an action on himself, just ignore the passed argument
          username = null;
        } else {
          // make sure the user is someone in the room
          const room = Room.getById(socket.user.roomId);

          const userInRoom = room.userInRoom(username);
          if (!userInRoom) {
            socket.emit('output', { message: `You don't see ${username} anywhere!` });
            return true;
          }
        }
      }

      const actionMessages = actionsData.actions[action];
      const messages = username ? actionMessages.target : actionMessages.solo;

      const fromUser = socket.user.username;
      const toUser = targetSocket ? targetSocket.user.username : null;

      if (messages.sourceMessage) {
        socket.emit('output', { message: utils.formatMessage(messages.sourceMessage, fromUser, toUser) });
      }

      if (messages.roomMessage) {
        const room = global.io.sockets.adapter.rooms[socket.user.roomId];

        Object.keys(room.sockets).forEach((socketId) => {
          // if you have a sourceMessage, don't send room message to source socket
          if (messages.sourceMessage && socketId === socket.id) {
            return;
          }

          // not to target user's socket
          if (targetSocket && messages.targetMessage && socketId === targetSocket.id) {
            return;
          }
          global.io.to(socketId).emit('output', { message: utils.formatMessage(messages.roomMessage, fromUser, toUser) });
        });
      }

      if (targetSocket && messages.targetMessage) {
        targetSocket.emit('output', { message: utils.formatMessage(messages.targetMessage, fromUser, toUser) });
      }
      return true;
    }
    return false;
  },
};
