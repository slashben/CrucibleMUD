import Shop from '../models/shop';
import autocomplete from '../core/autocomplete';
import socketUtil from '../core/socketUtil';
import commandCategories from '../core/commandCategories';

export default {
  name: 'sell',
  desc: 'sell your items at a shop',
  category: commandCategories.shop,

  patterns: [
    /^sell\s+(.+)$/i,
    /^sell\s.*/i,
  ],

  dispatch(socket, match) {
    if (match.length != 2) {
      return this.help(socket.character);
    }
    return this.execute(socket.character, match[1])
      .catch(response => socketUtil.output(socket, response));
  },

  execute(character, itemName) {

    // check if user has item
    const acResult = autocomplete.multiple(character, ['inventory'], itemName);
    if (!acResult) {
      return Promise.reject('You don\'t seem to be carrying that.');
    }

    const shop = Shop.getById(character.roomId);
    if (!shop) {
      return Promise.reject('This command can only be used in a shop.');
    }

    const itemType = shop.getItemTypeByAutocomplete(itemName);

    // check if shop carries this type of item
    const stockType = shop.stock.find(st => st.itemTypeName === itemType.name);
    if (!stockType) {
      return Promise.reject('This shop does not deal in those types of items.');
    }

    // check if item can be sold
    if (!itemType.price) {
      return Promise.reject('You cannot sell this item.');
    }

    const sellPrice = shop.getSellPrice(itemType);

    // check if shop has money
    if (shop.currency < sellPrice) {
      return Promise.reject('The shop cannot afford to buy that from you.');
    }

    shop.sell(character, itemType);
    if (sellPrice) {
      character.output(`You sold ${itemType.name} for ${sellPrice}.`);
      // todo: is item type enough here? There may be adjectives on items
      character.toRoom(`${character.name} sells ${itemType.name} to the shop.`, [character.id]);
    }
    return Promise.resolve();
  },

  help(character) {
    let output = '';
    output += '<span class="mediumOrchid">sell &lt;item name&gt </span><span class="purple">-</span> sell an item to a shop. <br />';
    character.output(output);
  },
};
