

export default {
  name: 'rest',
  desc: 'Gain HP at an increased rate while idle',


  patterns: [
    /^rest$/i,
  ],

  parseParams(match) {
    return [this.name, match[1]];
  },

  help(character) {
    const output = '<span class="mediumOrchid">rest </span><span class="purple">-</span> Recover hit points faster when idle.<br />';
    character.output(output);
  },
};
