import Room from '../models/room';

export default {
  name: 'open',

  patterns: [
    /^open\s+(\w+)$/i,
  ],

  dispatch(socket, match) {
    this.execute(socket, match[1]);
  },

  execute(socket, dir) {
    const d = Room.validDirectionInput(dir.toLowerCase());
    const room = Room.getById(socket.character.roomId);

    // valid exit in that direction?
    const exit = room.exits.find(e => e.dir === d);
    if (!exit) {
      socket.emit('output', { message: 'There is no exit in that direction!' });
      return;
    }

    if (exit.closed === undefined) {
      socket.emit('output', { message: 'There is no door in that direction!' });
      return;
    }

    if (exit.locked) {
      socket.emit('output', { message: 'That door is locked.' });
      return;
    }

    if (exit.closed === false) {
      socket.emit('output', { message: 'That door is already open.' });
      return;
    }

    exit.closed = false;
    socket.broadcast.to(socket.character.roomId).emit('output', { message: `${socket.user.username} opens the door to the ${Room.shortToLong(d)}.` });
    socket.emit('output', { message: 'Door opened.' });
  },

  help(socket) {
    const output = '<span class="mediumOrchid">open &lt;direction&gt; </span><span class="purple">-</span> Open a door in the given direction.<br />';
    socket.emit('output', { message: output });
  },
};
