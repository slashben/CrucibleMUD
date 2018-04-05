'use strict';

const mocks = require('../mocks');
const Room = require('../../models/room');
const socketUtil = require('../../socketUtil');
const sut = require('../../commands/teleport');

describe('teleport', function () {
  let socket, otherSocket;
  let currentRoom, otherRoom;

  beforeAll(function () {
    currentRoom = mocks.getMockRoom();
    currentRoom.name = 'OLD';
    otherRoom = mocks.getMockRoom();
    otherRoom.name = 'NEW';
    socket = new mocks.SocketMock();
    //socket.user = { roomId: 123, username: 'TestUser' };
    socket.user.username = 'TestUser';
    socket.user.roomId = currentRoom.id;
    otherSocket = new mocks.SocketMock();
    //otherSocket.user = { roomId: 321, username: 'OtherUser' };
    otherSocket.user.username = 'OtherUser';
    otherSocket.user.roomId = otherRoom.id;

  });

  describe('execute', function () {

    it('should teleport to another user\'s room if parameter is a username', function () {

      //TODO: get this to find OtherUser
      spyOn(socketUtil, 'getSocketByUsername').and.callFake(() => otherSocket);
      spyOn(Room, 'getById').and.callFake(() => otherRoom);

      //set current room
      socket.user.roomId = currentRoom.id;

      //teleport to user
      sut.execute(socket, 'OtherUser');

      //check current room
      expect(socket.user.roomId).toEqual(otherRoom._id);
      expect(socket.user.save).toHaveBeenCalled();

    });

    it('should teleport to room if parameter is a room', function () {

      //TODO: make mock room to send target to
      spyOn(Room, 'getById').and.callFake(() => otherRoom);

      //set current room
      socket.user.roomId = currentRoom.id;

      //teleport to room
      let toRoom = otherRoom.id;
      Room.roomCache[toRoom] = {};
      sut.execute(socket, toRoom);

      //check current room
      expect(socket.user.roomId).toEqual(otherRoom._id);
      expect(socket.user.save).toHaveBeenCalled();

    });

    it('should output messages when room cannot be found', function () {

      spyOn(Room, 'getById').and.callFake(() => null);

      let toRoom = otherRoom.id;
      Room.roomCache[toRoom] = {};
      sut.execute(socket, toRoom);

      expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Room not found.' });

    });

    it('should output messages when target is invalid user', function () {

      spyOn(socketUtil, 'getSocketByUsername').and.callFake(() => null);

      sut.execute(socket, 'Bobby');

      expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Target not found.' });

    });

    it('should be an admin command', function () {
      expect(sut.admin).toBe(true);
    });

  });

});
