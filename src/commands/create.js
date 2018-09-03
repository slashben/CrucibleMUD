import commandCategories from '../core/commandCategories';

export default {
  name: 'create',
  desc: 'create a room or door',
  category: commandCategories.world,
  admin: true,

  patterns: [
    /^create\s+.*$/i,
    /^create$/i,
  ],

  dispatch(socket) {
    this.help(socket.character);
  },

  execute() {
    throw 'Yuh dun sumthin real wrung if ya seein\' this';
  },

  help(character) {
    let output = '';
    output += '<span class="mediumOrchid">create room &lt;dir&gt; </span><span class="purple">-</span> Create new room in specified direction.<br />';
    output += '<span class="mediumOrchid">create door </span><span class="purple">-</span> Create new room in specified direction.<br />';
    output += '<span class="mediumOrchid">create area </span><span class="purple">-</span> Create new room in specified direction.<br />';
    character.output(output);
  },

};
