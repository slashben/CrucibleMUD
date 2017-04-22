'use strict';

const roomModel = require('./models/room.js');
const Item = require('./models/item');

// room cache
const rooms = {};
//const roomsWithMobs = [];

module.exports = {
  getRoomById(roomId, cb) {
    if (roomId in rooms) {
      console.log("found room in cache");
      cb(rooms[roomId]);
      return;
    }

    return roomModel.findById(roomId, function (err, room) {
      console.log("room lookup");
      if (err) {
        console.log(err);
        return;
      }

      if (room) {
        rooms[roomId] = room;
        room.mobs = [];
        room.inventory = room.inventory.map(item => new Item(item));
      }

      cb(room);
    });

  },

  /*
  updateRoomState(room) {
    rooms[room.id] = room;

    // maintain a list of rooms with mobs (for combat loop processing)
    const i = roomsWithMobs.indexOf(room.id);
    
    // if the there are mobs in the room, and the room is not in mob list
    if(room.mobs.length > 0 && i === -1) {
        roomsWithMobs.push(room.id);
    // if there are no mobs and the room is in the list
    } else if(i !== -1) {
      roomsWithMobs.splice(i, 1);
    }
  },
  */

  roomsWithMobs() {
    return Object.keys(rooms).reduce(function (filtered, key) {
      if (rooms[key].mobs.length > 0) {
        filtered.push(rooms[key]);
      }
      return filtered;
    }, []);

  }
  //rooms: rooms,
};
