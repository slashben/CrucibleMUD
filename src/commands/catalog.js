import mobData from '../data/mobData';
import itemData from '../data/itemData';
import Area from '../models/area';
import commandCategories from '../core/commandCategories';

export default {
  name: 'catalog',
  desc: 'list catalog of item types for use with spawn command',
  category: commandCategories.system,
  admin: true,

  patterns: [
    /^catalog (mobs)$/i,
    /^cat (mobs)$/i,
    /^catalog (items)$/i,
    /^cat (items)$/i,
    /^catalog (keys)$/i,
    /^cat (keys)$/i,
    /^catalog (areas)$/i,
    /^cat (areas)$/i,
    /^catalog$/i,
    /^catalog\s.*$/i,
    /^cat$/i,
  ],

  dispatch(socket, match) {
    if (match.length != 2) {
      this.help(socket.character);
      return Promise.resolve();
    }

    const type = match[1].toLowerCase();

    if (type === 'items') {
      this.execute(socket.character, itemData, 'item');
    } else if (type === 'mobs') {
      this.execute(socket.character, mobData);
    } else if (type === 'keys') {
      this.execute(socket.character, itemData, 'key');
    } else if (type === 'areas') {
      const areas = Object.values(Area.areaCache);
      this.execute(socket.character, areas);
    } else {
      socket.character.output('Unknown catalog: {types}');
    }
    return Promise.resolve();
  },

  execute(character, data, type) {

    let catalog;
    if (type) {
      catalog = data.catalog.filter(item => item.type === type);
    } else if (data.catalog) {
      catalog = data.catalog;
    } else {
      catalog = data;
    }

    let output = '<table><tr><th>Name</th></tr>';

    const listTable = catalog.map(({ name }) => `<tr><td>${name}</td></tr>`).join('\n');
    output += listTable;

    output += '</table>';

    character.output(output);
  },

  help(character) {
    let output = '';
    output += '<span class="mediumOrchid">[catalog|cat] mobs </span><span class="purple">-</span> Display info table of all valid mobs<br />';
    output += '<span class="mediumOrchid">[catalog|cat] items </span><span class="purple">-</span> Display info table of all valid items<br />';
    output += '<span class="mediumOrchid">[catalog|cat] keys </span><span class="purple">-</span> Display info table of all valid keys<br />';
    output += '<span class="mediumOrchid">[catalog|cat] areas </span><span class="purple">-</span> Display info table of all valid areas<br />';
    character.output(output);
  },
};
