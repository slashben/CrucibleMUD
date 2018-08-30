import autocomplete from '../core/autocomplete';
import Room from '../models/room';

export default {
  name: 'kick',
  desc: 'kick an item in a particular direction',

  patterns: [
    /^kick\s+(.+)\s+(\w+)$/i,
    /^kick\s+(.+)$/i,
    /^kick$/i,
  ],

  dispatch(socket, match) {
    if (match.length < 3) {
      this.help(socket);
      return;
    }
    this.execute(socket.character, match[1], match[2])
      .catch(error => socket.emit('output', { message: error }));
  },

  execute(character, itemName, dir) {

    const item = autocomplete.room(character, itemName);
    if (!item) {
      return Promise.reject('You don\'t see that item here');
    }

    if (!Room.validDirectionInput(dir)) {
      return Promise.reject('Invalid direction.');
    }

    const room = Room.getById(character.roomId);
    return room.kick(character, item, dir);
  },

  help(socket) {
    let output = '';
    output += '<span class="mediumOrchid">kick &lt;item name&gt; &lt;dir&gt;</span><span class="purple">-</span> Kick &lt;item&gt; from this room to the direction specified in &lt;dir&gt;<br />';
    socket.emit('output', { message: output });
  },
};