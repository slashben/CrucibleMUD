import Room from '../models/room';
import lookCmd from './look';

export default {
  name: 'set',
  admin: true,

  patterns: [
    /^set\s+(room)\s+(desc)\s+(.+)$/i,
    /^set\s+(room)\s+(name)\s+(.+)$/i,
    /^set\s+(room)\s+(alias)\s+(.+)$/i,
    /^set$/i,
  ],

  dispatch(socket, match) {

    // if we've matched on ^set, but the proper parameters
    // were not passed...
    if (match.length != 4) {
      // todo: print command help
      socket.emit('output', { message: 'Invalid command usage.' });
      return;
    }

    const type = match[1];
    const prop = match[2];
    const value = match[3];

    this.execute(socket, type, prop, value);
  },

  execute(socket, type, prop, value) {

    //todo: break these out into seperate helper methods?
    if (type === 'room') {
      const roomPropertyWhiteList = ['name', 'desc', 'alias'];
      if (!roomPropertyWhiteList.includes(prop)) {
        socket.emit('output', { message: 'Invalid property.' });
        return;
      }

      const room = Room.getById(socket.user.roomId);
      if (prop === 'alias') {
        if (value.toUpperCase() === 'NULL') {
          value = null;
          delete Room.roomCache[room.alias];
        }
        if (Room.roomCache[value]) return;
        Room.roomCache[value] = room;
      }
      room[prop] = value;
      room.save();
      socket.broadcast.to(socket.user.roomId).emit('output', { message: `${socket.user.username} has altered the fabric of reality.` });
      lookCmd.execute(socket);
    }
    else {
      socket.emit('output', { message: 'Invalid type.' });
      return;
    }
  },

  help(socket) {
    let output = '';
    output += '<span class="mediumOrchid">set room name &lt;new room name&gt; </span><span class="purple">-</span> Change name of current room.<br />';
    output += '<span class="mediumOrchid">set room desc &lt;new room desc&gt; </span><span class="purple">-</span> Change description of current room.<br />';
    output += '<span class="mediumOrchid">set room alias &lt;new room alias&gt; </span><span class="purple">-</span> Change admin alias of current room. Set alias to "null" to clear it.<br />';
    socket.emit('output', { message: output });
  },
};
