import autocomplete from '../../../core/autocomplete';

import { getDirection } from '../../../core/directions';

export default {
  name: 'unlock',
  desc: 'unlock a door with a key',


  patterns: [
    /^unlock\s+(\w+)\s+with\s+(.+)$/i,
    /^unlock\s+/i,
    /^unlock$/i,
  ],

  parseParams(match, character) {
    if(match.length != 3) return;
    const dir = getDirection(match[1]);
    const key = autocomplete.key(character, match[2]);
    return {actionName: this.name, actionParams: [dir, key]};
  },

  help(character) {
    let output = '';
    output += '<span class="mediumOrchid">unlock &lt;dir&gt; with &lt;key name&gt; </span><span class="purple">-</span> Unlock a door with the key type you are carrying.<br />';
    character.output(output);
  },

};
