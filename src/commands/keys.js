import socketUtil from '../core/socketUtil';
import commandCategories from '../core/commandCategories';

export default {
  name: 'keys',
  desc: 'list the keys your are currently carrying',
  category: commandCategories.character,
  
  patterns: [
    /^keys$/i,
  ],

  dispatch(socket) {
    this.execute(socket)
      .then(output => socketUtil.output(socket, output))
      .catch(error => socket.emit('output', { message: error }));
  },

  execute(character) {
    const keys = character.keys || [];
    let keyOutput = keys.map(({ name }) => name).join(', ');
    if (!keyOutput) {
      keyOutput = 'None.';
    }

    let output = '<span class=\'cyan\'>Key ring: </span>';
    output += '<span class=\'silver\'>';
    output += keyOutput;
    output += '</span>';

    return Promise.resolve(output);
  },

  help(socket) {
    let output = '';
    output += '<span class="mediumOrchid">keys </span><span class="purple">-</span> Display keys on your key ring.<br />';
    socket.emit('output', { message: output });
  },
};
