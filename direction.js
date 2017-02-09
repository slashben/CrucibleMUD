'use strict';

module.exports = {

  Feedback(dir) {
    const shortDir = module.exports.LongToShort(dir);
    const displayDir = module.exports.ExitName(shortDir);
    return `You move ${displayDir}...`;
  },

  LongToShort(dir) {
    switch (dir) {
      case 'north':
        return 'n';
      case 'northeast':
        return 'ne';
      case 'east':
        return 'e';
      case 'southeast':
        return 'se';
      case 'south':
        return 's';
      case 'southwest':
        return 'sw';
      case 'west':
        return 'w';
      case 'northwest':
        return 'nw';
      case 'up':
        return 'u';
      case 'down':
        return 'd';
      default:
        return dir;
    }
  },

  OppositeDirection(dir) {
    switch (dir) {
      case 'n':
        return 's';
      case 'ne':
        return 'sw';
      case 'e':
        return 'w';
      case 'se':
        return 'nw';
      case 's':
        return 'n';
      case 'sw':
        return 'ne';
      case 'w':
        return 'e';
      case 'nw':
        return 'se';
      case 'u':
        return 'd';
      case 'd':
        return 'u';
      default:
        return 'WHAT';
    }
  },

  // this is for database inputs and such
  ValidDirection(dir) {
    switch (dir) {
      case 'n':
      case 'ne':
      case 'e':
      case 'se':
      case 's':
      case 'sw':
      case 'w':
      case 'nw':
      case 'u':
      case 'd':
        return true;
      default:
        return false;
    }
  },

  // this is for user input
  ValidDirectionInput(dir) {
    switch (dir) {
      case 'n':
      case 'north':
      case 'ne':
      case 'northeast':
      case 'e':
      case 'east':
      case 'se':
      case 'southeast':
      case 's':
      case 'south':
      case 'sw':
      case 'southwest':
      case 'w':
      case 'west':
      case 'nw':
      case 'northwest':
      case 'u':
      case 'up':
      case 'd':
      case 'down':
        return true;
      default:
        return false;
    }
  },

  // used for building exits
  ExitName(dir) {
    switch (dir) {
      case 'n':
        return 'north';
      case 'ne':
        return 'northeast';
      case 'e':
        return 'east';
      case 'se':
        return 'southeast';
      case 's':
        return 'south';
      case 'sw':
        return 'southwest';
      case 'w':
        return 'west';
      case 'nw':
        return 'northwest';
      case 'u':
        return 'up';
      case 'd':
        return 'down';
      default:
        return 'INVALID_DIRECTION';
    }
  },

  DirectionToCoords(socket, dir) {
    let x = socket.room.x;
    let y = socket.room.y;
    let z = socket.room.z;

    if (dir.includes('e')) x += 1;
    if (dir.includes('w')) x -= 1;
    if (dir.includes('n')) y += 1;
    if (dir.includes('s')) y -= 1;
    if (dir.includes('u')) z += 1;
    if (dir.includes('d')) z -= 1;

    return { x, y, z };
  },

};
