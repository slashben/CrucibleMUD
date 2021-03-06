
import { getDirection } from '../../../core/directions';

export default {
  name: 'open',
  desc: 'open a door',


  patterns: [
    /^open\s+(\w+)$/i,
    /^op\s+(\w+)$/i,
  ],

  parseParams(match) {
    const dir = getDirection(match[1]);
    return {actionName: this.name, actionParams: [dir]};
  },

  help(character) {
    const output = '<span class="mediumOrchid">open &lt;direction&gt; </span><span class="purple">-</span> Open a door in the given direction.<br />';
    character.output(output);
  },
};
