'use strict';

module.exports = {
  name: "telepathy",

  patterns: [/^\//],

  dispatch(socket, match) {
  },

  execute(socket, input) {
    const re = /\/(\w+)\s+(.+)/;
    const tokens = data.match(re);
    if (tokens && tokens.length > 2) {
      const username = tokens[1];
      const message = tokens[2];

      const userSocket = globals.GetSocketByUsername(global.io, username);
      if (!userSocket) {
        socket.emit('output', { message: 'Invalid username.' });
        return;
      }
      const sender = globals.USERNAMES[socket.id];

      userSocket.emit('output', { message: `${sender} telepaths: ${message}` });
      socket.emit('output', { message: `Telepath to ${username}: ${message}` });
    } else {
      socket.emit('output', { message: 'Usage: /&lt;username&gt; &lt;message&gt;' });
    }
  },

  help() {},
}
