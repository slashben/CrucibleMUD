'use strict';

module.exports = {
  name: 'equip',

  patterns: [
    /^eq$/i,
    /^equip$/i,
    ///^equip\s+(\w+)\s+(.+)$/i,
    /^equip\s+(.+)$/i
  ],

  dispatch(socket, match) {
    module.exports.execute(socket, match[1], match[2]);
  },

  execute(socket, itemName, hand) {
    //check user.inventory for itemName
    // autocomplete name
    const itemNames = socket.user.inventory.map(i => i.displayName);
    const completedNames = global.AutocompleteName(socket, itemName, itemNames);
    if (completedNames.length === 0) {
      socket.emit('output', { message: 'You don\'t have that item in your inventory.\n' });
      return;
    } else if (completedNames.length > 1) {
      // todo: possibly print out a list of the matches
      socket.emit('output', { message: 'Not specific enough!\n' });
      return;
    }

    const item = socket.user.inventory.find(it => it.displayName === completedNames[0]);

    //if no match emit "itemName is not in your inventory" and return
    if (!item.equip) {
      socket.emit('output', { message: 'You cannot equip that!\n' });
      return;
    }

    //if match add itemName to appropriate character item slot
    switch (item.equip) {
      case "":
        break;
      case "mainHand":
        socket.user.equipSlots.weaponMain = item;
        break;
      case "offHand":
        socket.user.equipSlots.weaponOff = item;
        break;
      case "bothHand":
        socket.user.equipSlots.weaponMain = item;
        socket.user.equipSlots.weaponOff = item;
        break;
      case "eitherHand":
        if (hand == "main") {
          socket.user.equipSlots.weaponMain = item;
        }
        else if (hand == "off") {
          socket.user.equipSlots.weaponOff = item;
        }
        else {
          socket.emit('output', { message: 'Please specify which hand to equip the item\n' });
          return;
        }
        break;
      case "head":
        socket.user.equipSlots.head = item;
        break;
      case "body":
        socket.user.equipSlots.body = item;
        break;
      case "back":
        socket.user.equipSlots.back = item;
        break;
      case "legs":
        socket.user.equipSlots.legs = item;
        break;
      case "feet":
        socket.user.equipSlots.feet = item;
        break;
      case "arms":
        socket.user.equipSlots.arms = item;
        break;
      case "hands":
        socket.user.equipSlots.hands = item;
        break;
      case "neck":
        socket.user.equipSlots.neck = item;
        break;
      case "finger":
        if (hand == "main") {
          socket.user.equipSlots.fingerMain = item;
        }
        else if (hand == "off") {
          socket.user.equipSlots.fingerOff = item;
        }
        else {
          socket.emit('output', { message: 'Please specify which hand to equip the item\n' });
          return;
        }
        break;
      default:
        socket.emit('output', { message: 'Um, you want to put that where?!?!\n' });
        return;

      //add bonuses from itemName to corresponding character stats
    }

    socket.emit('output', { message: 'Item equipped.\n' });



    //TODO: REMOVE ITEM FROM INVENTORY BACKPACK (leaving item only in equip slot)
    //TODO: fix main/off hand selection (currently autocomplete takes in all parameters including the main/off hand bit...)
    


    socket.user.save();
  },

  help(socket) {
    let output = '';
    output += '<span class="mediumOrchid">equip &lt;item name&gt;</span><span class="purple">-</span> Equip &lt;item&gt; from inventory.  If &lt;item&gt; is a weapon, specify main/off to equip to one hand or the other (if able).<br />';
    socket.emit('output', { message: output });
  },
};
