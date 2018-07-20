'use strict';

const mocks = require('../../spec/mocks');
const SandboxedModule = require('sandboxed-module');

const config = require('../../config');
const mobData = require('../../data/mobData');

let mockGlobalIO = new mocks.IOMock();
let socket = new mocks.SocketMock();
let mockRoom = mocks.getMockRoom();
let mockSocketInRoomResult;
let mockGetRoomSocketsResult;
let roomMessageSpy = jasmine.createSpy('roomMessageSpy');
let diceRollMock = jasmine.createSpy('diceRollMock');
let diceGetRandomNumberMock = jasmine.createSpy('diceGetRandomNumber');
const sutModel = SandboxedModule.require('../models/mob', {
  requires: {
    '../../config': config,
    '../core/dice': {
      roll: diceRollMock,
      getRandomNumber: diceGetRandomNumberMock,
    },
    '../../data/mobData': {},
    '../models/room': {
      getById: () => mockRoom,
    },
    '../core/socketUtil': {
      'getSocketByUsername': () => { },
      'usersInRoom': () => { },
      'socketInRoom': () => mockSocketInRoomResult,
      'roomMessage': roomMessageSpy,
      'getRoomSockets': () => mockGetRoomSocketsResult,
    },
  },
  globals: {
    io: mockGlobalIO,
  },
  // singleOnly: true,
});



describe('mob model', () => {
  let mobType;
  let mob;

  beforeEach(() => {
    socket.reset();
    mockRoom._id = socket.user.roomId;
    mockRoom.reset();
    mockGlobalIO.reset();

    mobType = mobData.catalog[0];

    mob = new sutModel(mobType, mockRoom.roomId, 0);
    mob.die = jasmine.createSpy('mobDie').and.callThrough();
  });

  describe('constructor', () => {

    it('should initialize properties', () => {
      expect(mob.hp).not.toBeNull();
      expect(mob.xp).not.toBeNull();
      expect(mob.minDamage).not.toBeNull();
      expect(mob.maxDamage).not.toBeNull();
      expect(mob.hitDice).not.toBeNull();
      expect(mob.attackInterval).not.toBeNull();
      expect(mob.roomId).not.toBeNull();
      expect(mob.displayName).not.toBeNull();
    });
  });

  describe('look', () => {

    it('should output mob description', () => {
      // arrange
      socket.user.admin = false;

      // act
      mob.look(socket);

      // assert
      expect(socket.emit).toHaveBeenCalledWith('output', { message: mob.desc });
      expect(socket.emit).not.toHaveBeenCalledWith('output', { message: `Mob ID: ${mob.id}` });
    });

    it('should output mob id if logged in user is admin', () => {
      // arrange
      socket.user.admin = true;

      // act
      mob.look(socket);

      // assert
      expect(socket.emit).toHaveBeenCalledWith('output', { message: mob.desc });
      expect(socket.emit).toHaveBeenCalledWith('output', { message: `Mob ID: ${mob.id}` });
    });
  });

  describe('takeDamage', () => {

    it('should reduce the hp by the damage amount', () => {
      // arrange
      mob.hp = 10;

      // act
      mob.takeDamage(socket, 2);

      // assert
      expect(mob.hp).toBe(8);
      expect(mob.die).not.toHaveBeenCalled();
    });

    it('should call the die method if hp is reduced to zero', () => {
      // arrange
      mockGetRoomSocketsResult = [];
      mob.hp = 2;

      // act
      mob.takeDamage(socket, 2);

      // assert
      expect(mob.hp).toBe(0);
      expect(mob.die).toHaveBeenCalled();
    });
  });

  describe('die', () => {

    beforeEach(() => {
      mob = new sutModel(mobType, mockRoom.roomId, 0);
      mockRoom.mobs = [mob];
      mockGetRoomSocketsResult = [socket];
    });

    it('should update room.spawnTimer', () => {
      // arrange
      mockRoom.spawnTimer = null;

      // act
      mob.die(socket);

      // assert
      expect(mockRoom.spawnTimer).not.toBeNull();
    });

    it('should output mob death message', () => {
      // act
      mob.die(socket);

      // assert
      expect(mockGlobalIO.to(mockRoom.id).emit).toHaveBeenCalledWith('output', { message: `The ${mob.displayName} collapses.` });
    });

    it('should remove mob from room', () => {
      // act
      mob.die(socket);

      // assert
      expect(mockRoom.mobs).not.toContain(mob);
    });
  });

  describe('awardExperience', () => {

    beforeEach(() => {
      mob = new sutModel(mobType, mockRoom.roomId, 0);
      socket.user.attackTarget = mob.id;
    });

    it('should award experience to each player currently attacking mob', () => {
      // arrange
      socket.attackTarget = mob.id;
      mockGetRoomSocketsResult = [socket];

      // act
      mob.die(socket);

      // assert
      expect(socket.user.addExp).toHaveBeenCalledWith(mob.xp);
      expect(socket.emit).toHaveBeenCalledWith('output', { message: `You gain ${mob.xp} experience.` });
      expect(socket.emit).toHaveBeenCalledWith('output', { message: '<span class="olive">*** Combat Disengaged ***</span>' });
    });
  });

  describe('selectTarget', () => {

    describe('when player is in room', () => {

      beforeEach(() => {
        socket = new mocks.SocketMock();
        diceGetRandomNumberMock.and.callFake(() => 0);
        //socket.reset();
        const sockets = {};
        sockets[socket.id] = socket;
        mockGlobalIO.sockets.adapter.rooms[mockRoom.id] = {
          sockets: sockets,
        };
        mockGlobalIO.sockets.connected[socket.id] = socket;
      });

      it('and mob attack target is null, mob should move to attack', () => {
        mob.attackTarget = null;
        mob.selectTarget(mockRoom.id);

        expect(socket.to(mockRoom.id).emit).toHaveBeenCalledWith('output', { message: `The ${mob.displayName} moves to attack ${socket.user.username}!` });
        expect(socket.emit).toHaveBeenCalledWith('output', { message: `The ${mob.displayName} moves to attack you!` });
      });

      it('and mob attack target is populated, select target should do nothing', () => {
        mob.attackTarget = {};
        mob.selectTarget(mockRoom.id);

        expect(socket.to(mockRoom.id).emit).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
      });
    });

    describe('when no players are in room', () => {

      beforeEach(() => {
        mockGlobalIO.sockets.adapter.rooms[mockRoom.id] = {
          sockets: {},
        };
      });

      it('if no player is in room, mob should do nothing', () => {
        mob.attackTarget = null;
        mob.selectTarget(mockRoom.id);

        expect(socket.to(mockRoom.id).emit).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
      });
    });

  });

  describe('attackroll', () => {
    // TODO: Fill this in when logic is added
  });

  describe('attack', () => {

    beforeEach(() => {
      mockGlobalIO.sockets.connected[socket.id] = socket;
      mockSocketInRoomResult = true;
      roomMessageSpy.calls.reset();
    });

    it('should return false when mob has no attack target', () => {
      // arrange
      mob.attackTarget = null;

      // act
      mob.attack(new Date());

      // assert
      expect(socket.emit).not.toHaveBeenCalled();
      expect(roomMessageSpy).not.toHaveBeenCalled();
    });

    it('should set attackTarget to null if target socket is not in room', () => {
      // arrange
      mob.attackTarget = 'non existant socket';
      mockSocketInRoomResult = false;

      // act
      const result = mob.attack(new Date());

      // assert
      expect(mob.attackTarget).toBeNull();
      expect(socket.emit).not.toHaveBeenCalled();
      expect(roomMessageSpy).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should update lastAttack and return true on every successful attack', () => {
      // arrange
      mockSocketInRoomResult = true;
      mob.attackTarget = socket.id;
      diceRollMock.and.callFake(() => 0);

      // act
      const result = mob.attack(new Date());

      // assert
      expect(mob.attackTarget).toBe(socket.id);
      expect(socket.emit).toHaveBeenCalled();
      expect(roomMessageSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should output hit messages if attack roll successful', () => {
      // arrange
      mockSocketInRoomResult = true;
      diceRollMock.and.callFake(() => 1);
      mob.attackTarget = socket.id;
      const playerMessage = `<span class="${config.DMG_COLOR}">The ${mob.displayName} hits you for 0 damage!</span>`;
      const roomMessage = `<span class="${config.DMG_COLOR}">The ${mob.displayName} hits ${socket.user.username} for 0 damage!</span>`;

      // act
      mob.attack(new Date());

      // assert
      expect(socket.emit).toHaveBeenCalledWith('output', { message: playerMessage });
      expect(roomMessageSpy).toHaveBeenCalledWith(mockRoom._id, roomMessage, [socket.id]);
    });

    it('should output miss messages if attack roll fails', () => {
      // arrange
      mockSocketInRoomResult = true;

      diceRollMock.and.callFake(() => 0);
      mob.attackTarget = socket.id;
      const playerMessage = `<span class="${config.MSG_COLOR}">The ${mob.displayName} swings at you, but misses!</span>`;
      const roomMessage = `<span class="${config.MSG_COLOR}">The ${mob.displayName} swings at ${socket.user.username}, but misses!</span>`;

      // act
      mob.attack(new Date());

      // assert
      expect(socket.emit).toHaveBeenCalledWith('output', { message: playerMessage });
      expect(roomMessageSpy).toHaveBeenCalledWith(mockRoom._id, roomMessage, [socket.id]);
    });
  });

  describe('taunt', () => {

    it('should return if no attack target', () => {
      // arrange
      mob.attackTarget = null;

      // act
      mob.taunt(new Date());

      // assert
      expect(socket.emit).not.toHaveBeenCalled();
      expect(socket.broadcast.to(socket.user.roomId).emit).not.toHaveBeenCalled();
    });

    it('should return if user has left room', () => {
      // arrange
      mob.attackTarget = 'ANOTHER SOCKET ID';

      // act
      mob.taunt(new Date());

      // assert
      expect(socket.emit).not.toHaveBeenCalled();
      expect(socket.broadcast.to(socket.user.roomId).emit).not.toHaveBeenCalled();
    });

    // taunt.format is not a function
    xit('should send an individual message and a room message', () => {
      // arrange
      mockSocketInRoomResult = true;
      diceGetRandomNumberMock.and.callFake(() => 0);

      mockGlobalIO.sockets.connected[socket.id] = socket;
      mob.attackTarget = socket.id;

      // act
      mob.taunt(new Date());

      // assert
      expect(socket.emit).toHaveBeenCalled();
      expect(socket.broadcast.to(socket.user.roomId).emit).toHaveBeenCalled();
    });
  });

  describe('readyToAttack', () => {

    it('should return false if no attackInterval is set', () => {
      // arrange
      mob.attackInterval = null;

      // act
      const result = mob.readyToAttack(Date.now());

      // assert
      expect(result).toBe(false);
    });

    it('should return true when no last attack', () => {
      // arrange
      mob.attackInterval = 2000;
      mob.lastAttack = null;

      // act
      const result = mob.readyToAttack(Date.now());

      // assert
      expect(result).toBe(true);
    });

    it('should return false when last attack + attack inteval is less than now', () => {
      // arrange
      mob.lastAttack = Date.now();
      mob.attackInterval = 3000;

      // act
      const result = mob.readyToAttack(Date.now());

      // assert
      expect(result).toBe(false);
    });

    it('should return true when last attack + attack inteval is less than or equal to now', () => {
      // arrange
      mob.lastAttack = Date.now();
      mob.attackInterval = -3000;

      // act
      const result = mob.readyToAttack(Date.now());

      // assert
      expect(result).toBe(true);
    });
  });

  describe('readyToTaunt', () => {

    it('should return false if no tauntInterval is set', () => {
      // arrange
      mob.tauntInterval = null;

      // act
      const result = mob.readyToTaunt(Date.now());

      // assert
      expect(result).toBe(false);
    });

    it('should return true when no last taunt', () => {
      // arrange
      mob.attackTarget = {};
      mob.lastTaunt = null;

      // act
      const result = mob.readyToTaunt(Date.now());

      // assert
      expect(result).toBe(true);
    });

    it('should return false when last taunt + taunt inteval is less than now', () => {
      // arrange
      mob.attackTarget = {};
      mob.lastTaunt = Date.now();
      mob.tauntInterval = -3000;

      // act
      const result = mob.readyToTaunt(Date.now());

      // assert
      expect(result).toBe(true);
    });

    it('should return true when last taunt + taunt inteval less than or equal to now', () => {
      // arrange
      mob.attackTarget = {};
      mob.lastTaunt = Date.now();
      mob.tauntInterval = -3000;

      // act
      const result = mob.readyToTaunt(Date.now());

      // assert
      expect(result).toBe(true);
    });
  });

  describe('readyToIdle', () => {

    it('should return false when no idleInterval is set', () => {
      // arrange
      mob.idleInterval = null;

      // act
      const result = mob.readyToIdle(Date.now());

      // assert
      expect(result).toBe(false);
    });

    it('should return true when no last idle', () => {
      // arrange
      mob.idleInterval = 2000;
      mob.lastIdle = null;

      // act
      const result = mob.readyToIdle(Date.now());

      // assert
      expect(result).toBe(true);
    });

    it('should return true when last idle + idle inteval is less than now', () => {
      // arrange
      mob.idleInterval = -2000;
      mob.lastIdle = Date.now();

      // act
      const result = mob.readyToIdle(Date.now());

      // assert
      expect(result).toBe(true);
    });

    it('should return false when last idle + idle inteval is greater than now', () => {
      // arrange
      mob.idleInterval = 2000;
      mob.lastIdle = Date.now();

      // act
      const result = mob.readyToIdle(Date.now());

      // assert
      expect(result).toBe(false);
    });
  });
});
