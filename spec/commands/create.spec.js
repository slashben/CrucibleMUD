'use strict';

const roomManager = require('../../roomManager');
const Room = require('../../models/room');
const mocks = require('../mocks');
const sut = require('../../commands/create');

describe('create', function () {
  let socket;
  let room;
  let shortDir = 'shortDir';

  beforeAll(function () {
    socket = new mocks.SocketMock();
  });

  describe('dispatch triggers execute', function () {
    let executeSpy;

    beforeAll(function () {
      executeSpy = spyOn(sut, 'execute');
    });

    afterAll(function () {
      executeSpy.and.callThrough();
    });

    it('with type and param', function () {
      let type = 'room';
      let param = 'thing';
      sut.dispatch(socket, ['create', type, param]);
      
      expect(executeSpy).toHaveBeenCalledWith(socket, type, param);
    });
  });

  describe('execute', function () {

    beforeEach(function () {
      room = mocks.getMockRoom();
      spyOn(roomManager, 'getRoomById').and.callFake(() => room);
      spyOn(roomManager, 'createRoom').and.callFake((room, dir, someFunc) => {
        someFunc();
      });
      spyOn(Room, 'exitName').and.callFake(() => shortDir);
    });

    describe('when type is room', function () {
      it('should accept valid forms of direction input', function () {
        let dir = 'n';
        sut.execute(socket, 'room', dir);

        expect(roomManager.createRoom).toHaveBeenCalledWith(room, dir, jasmine.any(Function));
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Room created.' });
        expect(socket.broadcast.to().emit).toHaveBeenCalledWith('output', { message: `${socket.user.username} waves his hand and an exit appears to the ${shortDir}!` });
      });

      it('should output error message when direction in invalid', function () {
        let dir = 'invalid dir';
        sut.execute(socket, 'room', dir);

        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Invalid direction!' });
      });

      // TODO: The create room lives in the roomManager. Creating a door should probably
      // also be moved to a new method called create/updateDoor on the roomManager.
      // doesn't make sense to have some state/database updates in the manager and some
      // in the command code.
      xit('should update roomManager current state and database with door on success', function () {
      });
    });

    describe('when type is door', function () {
      it('should accept valid direction input', function () {
        const dir = 'n';
        sut.execute(socket, 'door', dir);

        expect(room.getExit).toHaveBeenCalledWith(dir);
        expect(room.save).toHaveBeenCalled();
      });

      it('should output error message when direction in invalid', function () {
        const dir = 'n';
        room.getExit.and.returnValue(undefined);

        sut.execute(socket, 'door', dir);

        expect(room.getExit).toHaveBeenCalledWith(dir);
        expect(room.save).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Invalid direction.' });
      });
    });

    it('should output error when create type is invalid', function () {
      sut.execute(socket, 'other', 'n');

      expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Invalid create type.' });
    });

    it('should be an admin command', function () {
      expect(sut.admin).toBe(true);
    });

    it('help should output message', function () {
      sut.help(socket);

      expect(socket.emit).toHaveBeenCalledWith('output', { message: '<span class="mediumOrchid">create room &lt;dir&gt; </span><span class="purple">-</span> Create new room in specified direction.<br />' });
    });
  });
});