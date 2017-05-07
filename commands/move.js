'use strict';

const Room = require('../models/room');
const roomManager = require('../roomManager');

const breakCommand = require('./break');
const lookCommand = require('./look');

function Feedback(dir) {
  const shortDir = global.LongToShort(dir);
  const displayDir = Room.exitName(shortDir);
  return `You move ${displayDir}...`;
}

function HitWall(socket, dir) {
  let message = '';

  // send message to everyone in current room that player is running into stuff.
  if (dir === 'u') {
    message = `${socket.user.username} runs into the ceiling.`;
  } else if (dir === 'd') {
    message = `${socket.user.username} runs into the floor.`;
  } else {
    message = `${socket.user.username} runs into the wall to the ${Room.exitName(dir)}.`;
  }
  socket.broadcast.to(socket.user.roomId).emit('output', { message: `<span class="silver">${message}</span>` });
  socket.emit('output', { message: '<span class="yellow">There is no exit in that direction!</span>' });
}

function HitDoor(socket, dir) {
  let message = '';

  // send message to everyone in current room that player is running into stuff.
  if (dir === 'u') {
    message = `${socket.user.username} runs into the closed door above.`;
  } else if (dir === 'd') {
    message = `${socket.user.username} runs into the trapdoor on the floor.`;
  } else {
    message = `${socket.user.username} runs into the door to the ${Room.exitName(dir)}.`;
  }
  socket.broadcast.to(socket.user.roomId).emit('output', { message: `<span class="silver">${message}</span>` });
  socket.emit('output', { message: '<span class="yellow">The door in that direction is not open!</span>' });
}

// emits "You hear movement to the <dir>" to all adjacent rooms
function MovementSounds(socket, room, excludeDir) {
  // fromRoomId is your current room (before move)
  room.exits.forEach((exit) => {
    if (excludeDir && exit.dir === excludeDir) {
      return;
    }

    let message = '';
    if (exit.dir === 'u') {
      message = 'You hear movement from below.';
    } else if (exit.dir === 'd') {
      message = 'You hear movement from above.';
    } else {
      message = `You hear movement to the ${Room.exitName(Room.oppositeDirection(exit.dir))}.`;
    }

    // ES6 object literal shorthand syntax... message here becomes message: message
    socket.broadcast.to(exit.roomId).emit('output', { message });
  });
}


module.exports = {
  name: "move",

  patterns: [
    /^n$/i,
    /^s$/i,
    /^e$/i,
    /^w$/i,
    /^ne$/i,
    /^nw$/i,
    /^se$/i,
    /^sw$/i,
    /^u$/i,
    /^d$/i,
    /^north$/i,
    /^south$/i,
    /^east$/i,
    /^west$/i,
    /^northeast$/i,
    /^northwest$/i,
    /^southeast$/i,
    /^southwest$/i,
    /^up$/i,
    /^down$/i,
  ],

  dispatch(socket, match) {
    console.log(match);
    module.exports.execute(socket, match[0]);
  },

  execute(socket, dir) {
    let d = dir.toLowerCase();

    // changes "north" to "n" (just returns "n" if that's what's passed in)
    d = global.LongToShort(d);

    const room = roomManager.getRoomById(socket.user.roomId);

    // valid exit in that direction?
    const exit = room.exits.find(e => e.dir === d);
    if (!exit) {
      HitWall(socket, d);
      return;
    }

    if (exit.closed) {
      HitDoor(socket, d);
      return;
    }

    let message = '';
    if (!room) {
      // hrmm if the exit was just validated, this should never happen.
      HitWall(socket, d);
      console.log("WARNING: Query couldn't find next room when going through a exit.");
      return;
    }

    var username = socket.user.username;

    // send message to everyone in old room that player is leaving
    if (d === 'u') {
      message = `${username} has gone above.`;
    } else if (d === 'd') {
      message = `${username} has gone below.`;
    } else {
      message = `${username} has left to the ${Room.exitName(d)}.`;
    }

    // stop mobs attacking this user (since he is leaving the room)
    breakCommand.execute(socket);

    socket.broadcast.to(room.id).emit('output', { message });
    MovementSounds(socket, room, d);
    console.log("Leaving room: ", room.id);
    socket.leave(room.id);

    // update user session
    socket.user.roomId = exit.roomId;
    console.log("Joining room: ", exit.roomId);
    socket.user.save();
    socket.join(exit.roomId);

    MovementSounds(socket, room, Room.oppositeDirection(d));

    // send message to everyone is new room that player has arrived
    if (d === 'u') {
      message = `${username} has entered from below.`;
    } else if (d === 'd') {
      message = `${username} has entered from above.`;
    } else {
      message = `${username} has entered from the ${Room.exitName(Room.oppositeDirection(d))}.`;
    }
    socket.broadcast.to(exit.roomId).emit('output', { message });

    // You have moved south...
    socket.emit('output', { message: Feedback(dir) });
    lookCommand.execute(socket);

  },

  help(socket) {
    let output = '';
    output += '<span class="cyan">move command </span><span class="darkcyan">-</span> Move in specified direction. Move command word is not used.<br />';
    output += '<span class="mediumOrchid">n<span class="purple"> | </span>north</span> <span class="purple">-</span> Move north.<br />';
    output += '<span class="mediumOrchid">s<span class="purple"> | </span>south</span> <span class="purple">-</span> Move south.<br />';
    output += '<span class="mediumOrchid">e<span class="purple"> | </span>east</span> <span class="purple">-</span> Move east.<br />';
    output += '<span class="mediumOrchid">w<span class="purple"> | </span>west</span> <span class="purple">-</span> Move west.<br />';
    output += '<span class="mediumOrchid">ne<span class="purple"> | </span>northeast</span> <span class="purple">-</span> Move northeast.<br />';
    output += '<span class="mediumOrchid">se<span class="purple"> | </span>southeast</span> <span class="purple">-</span> Move southeast.<br />';
    output += '<span class="mediumOrchid">nw<span class="purple"> | </span>northwest</span> <span class="purple">-</span> Move northwest.<br />';
    output += '<span class="mediumOrchid">sw<span class="purple"> | </span>southwest</span> <span class="purple">-</span> Move southwest.<br />';
    output += '<span class="mediumOrchid">u<span class="purple"> | </span>up</span> <span class="purple">-</span> Move up.<br />';
    output += '<span class="mediumOrchid">d<span class="purple"> | </span>down</span> <span class="purple">-</span> Move down.<br />';
    socket.emit('output', { message: output });
  },
};
