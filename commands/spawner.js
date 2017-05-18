'use strict';

const roomManager = require('../roomManager');
//const Room = require('../models/room');
const Mob = require('../models/mob');
const mobData = require('../data/mobData');

// Not sure if the global server code should really be living with
// the command, but it's okay here for now.
setInterval(() => {

  const now = Date.now();

  // loop through rooms that contain mobs...
  roomManager.roomsWithSpawners().forEach(function (room) {
    let max = room.spawner.max ? room.spawner.max : 10;
    let timeout = room.spawner.timeout ? room.spawner.timeout : 4000;
    
    if(!room.lastMobDeath) {
      room.lastMobDeath = now;
    }

    if(room.mobs.length < max && now - room.lastMobDeath >= timeout && room.spawner.mobTypes.length > 0) {
      let mobTypeIndex = global.getRandomNumber(0, room.spawner.mobTypes.length);
      let mobTypeName = room.spawner.mobTypes[mobTypeIndex];
      let mobType = mobData.catalog.find(mob => mob.name.toLowerCase() === mobTypeName.toLowerCase());
      let mob = new Mob(mobType, room.id);
      room.mobs.push(mob);
      global.io.to(room.id).emit('output', {message: `<span class="yellow">A ${mobType.displayName} appears!</span>`});
    }

  });
}, global.SPAWNER_INTERVAL);



module.exports = {
  name: "spawner",
  admin: true,

  patterns: [
    /^spawner$/i,
    /^spawner\s+(add)\s+(\w+)$/i,
    /^spawner\s+(remove)\s+(\w+)$/i,
    /^spawner\s+(max)\s+(\d+)$/i,
    /^spawner\s+(timeout)\s+(\d+)$/i,
    /^spawner\s+(clear)$/i,
    /^spawner\s+(copy)$/i,
    /^spawner\s+(paste)$/i,
    /^spawner\s+$/i,
  ],

  dispatch(socket, match) {
    module.exports.execute(socket, match[1], match[2]);
  },

  execute(socket, action, param) {
    const room = roomManager.getRoomById(socket.user.roomId);
    action = action ? action.toLowerCase() : null;

    if (!room.spawner) {
      room.spawner = {};
    }

    switch (action) {
      case 'add':
        let addMobType = mobData.catalog.find(mob => mob.name.toLowerCase() === param.toLowerCase());
        // todo: maybe just save the mob name? Saving the whole object right now.
        room.spawner.mobTypes.push(addMobType.name);
        room.save();
        socket.emit('output', { message: "Creature added to spawner." });
        break;
      case 'remove':
        let removeMobType = mobData.catalog.find(mob => mob.name.toLowerCase() === param.toLowerCase());
        // todo: maybe just save the mob name? Saving the whole object right now.
        let index = room.spawner.mobTypes.indexOf(removeMobType.name);
        if (index !== -1) {
          room.spawner.mobTypes.splice(index);
          room.save();
          socket.emit('output', { message: "Creature removed from spawner." });
        } else {
          socket.emit('output', { message: "Creature not found on spawner." });
        }
        break;
      case 'max':
        room.spawner.max = param;
        room.save();
        socket.emit('output', { message: `Max creatures updated to ${param}.` });
        break;
      case 'timeout':
        room.spawner.timeout = param;
        room.save();
        socket.emit('output', { message: `Timeout updated to ${param}.` });
        break;
      case 'clear':
        room.spawner = {};
        room.save();
        socket.emit('output', { message: 'Spawner cleared.' });
        break;
      case 'copy':
        socket.user.spawnerClipboard = room.spawner;
        socket.emit('output', { message: 'Spawner copied.' });
        break;
      case 'paste':
        room.spawner = socket.user.spawnerClipboard;
        socket.emit('output', { message: 'Spawner pasted.' });
        break;
      default:
        let desc = room.spawner ? room.spawner.toString() : "None.";
        socket.emit('output', { message: desc });
    }

  },

  help(socket) {
    let output = '<span class="mediumOrchid">spawner </span><span class="purple">-</span> Show spawner settings for current room.<br />';
    output += '<span class="mediumOrchid">spawner &lt;add&gt; </span><span class="purple">-</span> Add creature to the current room\'s spawner.<br />';
    output += '<span class="mediumOrchid">spawner &lt;remove&gt; </span><span class="purple">-</span> Remove a creature from the current room\'s spawner.<br />';
    output += '<span class="mediumOrchid">spawner &lt;max&gt; </span><span class="purple">-</span> Set max number of creatures for this room.<br />';
    output += '<span class="mediumOrchid">spawner &lt;timeout&gt; </span><span class="purple">-</span> Set timeout from creature death until next spawn.<br />';
    output += '<span class="mediumOrchid">spawner &lt;clear&gt; </span><span class="purple">-</span> Clear all spawner settings for this room.<br />';
    output += '<span class="mediumOrchid">spawner &lt;copy&gt; </span><span class="purple">-</span> Copy the current room\'s spawner settings.<br />';
    output += '<span class="mediumOrchid">spawner &lt;paste&gt; </span><span class="purple">-</span> Paste a room\'s spawner settings.<br />';
    socket.emit('output', { message: output });
  },
};