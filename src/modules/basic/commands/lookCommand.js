import { getDirection } from '../../../core/directions';
import autocomplete from '../../../core/autocomplete';
import Room from '../../../models/room';

export default {
  name: 'look',
  desc: 'look around you or examine an item, mob, or player',

  patterns: [
    /^$/,
    /^l$/i,
    /^look$/i,
    /^look\s+(.+)$/i,
    /^read\s+(.+)$/i,
    /^l\s+(.+)$/i,
  ],

  parseParams(match, character) {
    let lookTarget = null;
    const short = (match[0] === '');
    if (match.length > 1) {
      lookTarget = match[1];

      // look called on self
      if (lookTarget === 'me' || lookTarget === 'self') {
        lookTarget = character;
      } else {
        const dir = getDirection(lookTarget);
        if(dir) {
          lookTarget = dir;
        } else {
          const acResult = autocomplete.multiple(character, ['inventory', 'room', 'mob', 'character'], lookTarget);
          lookTarget = acResult.item;
        }
      }
    } else {
      lookTarget = Room.getById(character.roomId);
    }
    return {actionName: this.name, actionParams: [short, lookTarget]};
  },

  help(character) {
    let output = '';
    output += '<span class="mediumOrchid">l <span class="purple">|</span> look </span><span class="purple">-</span> Display info about current room.<br />';
    output += '<span class="mediumOrchid">look &lt;item/mob name&gt; </span><span class="purple">-</span> Display detailed info about &lt;item/mob&gt;.<br />';
    character.output(output);
  },

};
