'use strict';

const mocks = require('../../spec/mocks');
const SandboxedModule = require('sandboxed-module');
const Room = require('../models/room');

let mockRoom;
const sut = SandboxedModule.require('./create', {
  requires: {
    '../models/room': {
      getById: () => mockRoom,
      validDirection: Room.validDirection,
      validDirectionInput: Room.validDirectionInput,
      longToShort: Room.longToShort,
      shortToLong: Room.shortToLong,
    },
  },
});

describe('create', () => {
  let socket;
  let shortDir = 'north';

  beforeAll(() => {
    socket = new mocks.SocketMock();
  });

  describe('dispatch triggers execute', () => {
    let executeSpy;

    beforeAll(() => {
      executeSpy = spyOn(sut, 'execute');
    });

    it('with type and param', () => {
      let type = 'room';
      let param = 'thing';
      sut.dispatch(socket, ['create', type, param]);

      expect(executeSpy).toHaveBeenCalledWith(socket, type, param);
    });
  });

  describe('execute', () => {

    beforeEach(() => {
      mockRoom = mocks.getMockRoom();
      spyOn(mockRoom, 'createRoom').and.callFake((dir, someFunc) => {
        someFunc();
      });
    });

    describe('when type is room', () => {
      it('should accept valid forms of direction input', () => {
        sut.execute(socket, 'room', 'n');

        expect(mockRoom.createRoom).toHaveBeenCalledWith('n', jasmine.any(Function));
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Room created.' });
        expect(socket.broadcast.to(socket.user.roomId).emit).toHaveBeenCalledWith('output', { message: `${socket.user.username} waves his hand and an exit appears to the ${shortDir}!` });
      });

      it('should output error message when direction in invalid', () => {
        let dir = 'invalid dir';
        sut.execute(socket, 'room', dir);

        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Invalid direction!' });
      });
    });

    describe('when type is door', () => {
      it('should accept valid direction input', () => {
        const dir = 'n';
        sut.execute(socket, 'door', dir);

        expect(mockRoom.getExit).toHaveBeenCalledWith(dir);
        expect(mockRoom.getExit('n').closed).toBe(true);
        expect(mockRoom.save).toHaveBeenCalled();
      });

      it('should output error message when direction in invalid', () => {
        const dir = 'n';
        mockRoom.getExit.and.returnValue(undefined);

        sut.execute(socket, 'door', dir);

        expect(mockRoom.getExit).toHaveBeenCalledWith(dir);
        expect(mockRoom.save).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Invalid direction.' });
      });
    });

    it('should output error when create type is invalid', () => {
      sut.execute(socket, 'other', 'n');

      expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Invalid create type.' });
    });

    it('should be an admin command', () => {
      expect(sut.admin).toBe(true);
    });

    it('help should output message', () => {
      sut.help(socket);

      expect(socket.emit).toHaveBeenCalledWith('output', { message: '<span class="mediumOrchid">create room &lt;dir&gt; </span><span class="purple">-</span> Create new room in specified direction.<br />' });
    });
  });
});
