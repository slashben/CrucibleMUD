const mocks = require('../../spec/mocks');
const SandboxedModule = require('sandboxed-module');

let mockRoom = mocks.getMockRoom();
const sut = SandboxedModule.require('./spawner', {
  requires: {
    '../models/room': {
      roomCache: {},
      getById: jasmine.createSpy('getByIdSpy').and.callFake(() => mockRoom),
    },
  },
});
const SpawnerModel = require('../models/spawner');

describe('spawner', () => {
  let socket;
  let currentRoom;

  beforeEach(() => {
    currentRoom = mocks.getMockRoom();
    currentRoom.name = 'Dance Floor';
    currentRoom.spawner = new SpawnerModel();
    currentRoom.spawner.mobTypes.push(mocks.mobType.name);
    socket = new mocks.SocketMock();
    socket.user.roomId = currentRoom.id;
    socket.user.username = 'Disco Jim';
  });

  describe('execute', () => {

    describe('when action is add', () => {
      it('should successfully add valid mob type', () => {
        // arrange
        const beforeLength = currentRoom.spawner.mobTypes.length;
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'add', 'kobold');

        // assert
        expect(currentRoom.save).toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Creature added to spawner.' });
        expect(currentRoom.spawner.mobTypes.length).toBeGreaterThan(beforeLength);
      });

      xit('should output error message when mob type is invalid', () => {
      });
    });

    describe('when action is remove', () => {
      it('should remove existing mob type', () => {
        // arrange
        const beforeLength = currentRoom.spawner.mobTypes.length;
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'remove', 'kobold');

        // assert
        expect(currentRoom.save).toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Creature removed from spawner.' });
        expect(currentRoom.spawner.mobTypes.length).toBeLessThan(beforeLength);
      });

      xit('should output error message when mob type is invalid', () => {
      });

      it('should output error when mob type does not exist on spawner', () => {
        // arrange
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'remove', 'dummy');

        // assert
        expect(currentRoom.save).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Creature not found on spawner.' });
      });
    });


    describe('when action is max', () => {
      xit('should output error message when param value is not an integer', () => {
      });

      it('should set max when value is valid', () => {
        // arrange
        currentRoom.spawner.max = 2;
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'max', 7);

        // assert
        expect(currentRoom.save).toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Max creatures updated to 7.' });
        expect(currentRoom.spawner.max).toEqual(7);
      });
    });

    describe('when action is timeout', () => {
      it('when set timeout when value is valid', () => {
        // arrange
        currentRoom.spawner.timeout = 1;
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'timeout', 5);

        // assert
        expect(currentRoom.save).toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Timeout updated to 5.' });
        expect(currentRoom.spawner.timeout).toEqual(5);
      });

      xit('should output error message when param value is not an integer', () => {
      });
    });

    describe('when action is clear', () => {
      it('when action is clear', () => {
        // arrange
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'clear');

        // arrange
        expect(currentRoom.save).toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Spawner cleared.' });
        expect(currentRoom.spawner).toBeNull();
      });
    });

    describe('when action is copy', () => {
      it('when action is copy', () => {
        // arrange
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'copy');

        // assert
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Spawner copied.' });
        expect(socket.user.spawnerClipboard).toEqual(currentRoom.spawner);
      });
    });

    describe('when action is paste', () => {
      it('when action is paste', () => {
        // arrange
        socket.user.spawnerClipboard = null;
        mockRoom = currentRoom;

        // act
        sut.execute(socket, 'paste');

        // assert
        expect(socket.emit).toHaveBeenCalledWith('output', { message: 'Spawner pasted.' });
        expect(currentRoom.spawner).toBeNull();
      });
    });

    it('when action is not valid', () => {
      // arrange
      mockRoom = currentRoom;

      // act
      sut.execute(socket, 'multiply');

      // assert
      expect(socket.emit).toHaveBeenCalledWith('output', { message: (currentRoom.spawner ? currentRoom.spawner.toString() : 'None.') });
    });
  });
});
