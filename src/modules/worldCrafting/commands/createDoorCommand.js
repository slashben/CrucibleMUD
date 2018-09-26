import commandCategories from '../../../core/commandCategories';

export default {
  name: 'create door',
  desc: 'creates a door on an existing exit',
  category: commandCategories.world,
  admin: true,

  patterns: [
    /^create\s+door\s+(\w+)$/i,
  ],

  parseParams(match) {
    if (match.length != 2) return false;
    return [this.name, match[1]];
  },

  help(character) {
    let output = '';
    output += '<span class="mediumOrchid">create door </span><span class="purple">-</span> Create new room in specified direction.<br />';
    character.output(output);
  },

};
