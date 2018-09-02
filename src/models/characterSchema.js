/** @module models/CharacterSchema */
import mongoose from 'mongoose';
import config from '../config';
import ItemSchema from './itemSchema';
import Room from './room';
import dice from '../core/dice';
import socketUtil from '../core/socketUtil';
import characterStates, { stateMode } from '../core/characterStates';
import CharacterEquipSchema from './characterEquipSchema';
import { updateHUD } from '../core/hud';
import { pronounSubject, upperCaseWords, verbToThirdPerson } from '../core/language';
import healthStatus from '../models/enums/healthStatuses';

/**
 * @constructor
 */
const CharacterSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  roomId: String,

  gender: { type: String, enum: ['male', 'female'], default: 'male' },

  inventory: [ItemSchema],
  keys: [ItemSchema],
  currency: Number,

  equipped: {
    type: CharacterEquipSchema,
    default: CharacterEquipSchema,
  },

  armorRating: Number,

  xp: Number,
  level: Number,

  maxHP: Number,
  currentHP: Number,

  actionDie: String,  // base die for all of player's action results to add variance
  attacksPerRound: Number,

  stats: {
    strength: Number,
    intelligence: Number,
    dexterity: Number,
    charisma: Number,
    constitution: Number,
    willpower: Number,
  },

  skills: {

    stealth: Number, // ability to not be seen/heard (DEX)
    lockpick: Number, // open non-magical locks (DEX)
    pickpocket: Number, // steal from others (DEX)


    // combine to perception
    search: Number, // visual (hidden door, trap, etc) (INT)
    listen: Number, // auditory (sounds beyond door, wind outside cave entrance, etc) (INT)
    detect: Number, // magical (active spell, illusion, etc) (INT/WIL)

    //unarmed?

    identify: Number, // determine hidden qualities of objects (INT)
    disable: Number, // eliminate traps (DEX)
    negotiate: Number, // make deals with others (CHA)
    bluff: Number, // mislead/swindle others (CHA)
    intimidate: Number, // force others to comply through fear (STR/CHA)
    magic: Number, // affinity/skill with magic (INT/WIL)
    weapons: Number, // affinity/skill with weapons (STR/DEX) // subweapon skills? (dual, ranged, one hand, two hand, pierce, slash, bludge)

    conceal: Number, // hide objects (DEX)
    heal: Number, // minor self heal (CON)

    refresh: Number, // minor self revitalization of energy (WIL)

    endure: Number, // survive what others cannot (resist poison, no KO, etc) (CON)

    resist: Number, // shield from magic (resist spell, see through illusion/charm, etc) (WIL)
  },
}, { usePushEach: true });

//============================================================================
// Statics
//============================================================================

/**
 * Finds a connected character.
 * @param {String} name - name of the character to find
 * @memberof module:models~Character
 */
CharacterSchema.statics.findByName = function (name) {
  const userRegEx = new RegExp(`^${name}$`, 'i');
  return this.findOne({ name: userRegEx }).populate('user');
};

CharacterSchema.statics.findByUser = function (user) {
  return this.findOne({ user: user });
};

//============================================================================
// Instance methods
//============================================================================
CharacterSchema.methods.getDesc = function () {
  // todo: Add character specific details. Currently only returning the description of equipped items.
  return this.equipped.getDesc().then(output => {
    const pronoun = upperCaseWords(pronounSubject(this.gender));
    output += `\n${pronoun} is ${this.status()}.`;
    if (this.bleeding) {
      output += `<span class="red">${this.name} is bleeding out!</span>\n`;
    }
    output += '\n';
    return Promise.resolve(output);
  });
};

CharacterSchema.methods.nextExp = function () {
  const BASE_XP = 300;
  const BASE_RATE = 1;
  return BASE_XP * ((1 + BASE_RATE) ** (this.level - 1));
};

CharacterSchema.methods.addExp = function (amount) {
  this.xp += amount;
  while (this.xp >= this.nextExp()) {
    this.level++;
  }
  this.save(err => { if (err) throw err; });
};

CharacterSchema.methods.readyToAttack = function (now) {
  return this.attackTarget && (!this.lastAttack || this.lastAttack + this.attackInterval <= now);
};

CharacterSchema.methods.attackroll = () => /*
/* UserSchema.methods.attackroll = weapon =>
var wdParts = weapon.damage.spltest(" ");

if(!weapon) {
  return this.strengh + (dice.roll(this.actionDie) - 2);  --bare fist
}
if(weapon.range = 'melee') {
  return this.strengh + dice.roll(wdParts[0]) + wdParts[1];
}
console.log('attackroll weapon resolution error');
return 0;
*/

  // just return 0 or 1 for now
  dice.roll('1d2');



// TODO: perhaps have miss verbs per weapon type also: "thrusts at, stabs at" in addition to "swings at"
CharacterSchema.methods.getAttackVerb = function (weapon) {
  const weaponType = weapon ? weapon.weaponType : 'unarmed';
  const attackVerbs = {
    'slashing': ['slash', 'stab', 'cut', 'hack', 'chop', 'cleave'],
    'piercing': ['pierce', 'stick', 'stab', 'impale', 'skewer', 'spear', 'lance', 'thrust'],
    'bludgeoning': ['bludgeon', 'club', 'whop', 'swat', 'hit', 'smack', 'smash', 'wallop', 'bash', 'thump'],
    'unarmed': ['uppercut', 'punch', 'sock', 'smack', 'jab', 'slap', 'bash', 'pummel', 'slam', 'slug', 'strike', 'thump'],
  };
  const verbs = attackVerbs[weaponType];
  const verbIndex = dice.getRandomNumber(0, verbs.length);
  return verbs[verbIndex];
};

CharacterSchema.methods.attack = function (mob, now) {
  if (!this.readyToAttack(now)) return;
  if (!mob) return;
  this.lastAttack = now;

  let actorMessage = '';
  let roomMessage = '';

  let attackResult = this.attackroll();
  const hit = attackResult === 2;

  // a successful attack
  let weapon;
  if (hit) {
    weapon = this.inventory.id(this.equipped.weaponMain);
    let diceToRoll = weapon ? dice.roll(weapon.damage) : '1d2';
    let dmg = dice.roll(diceToRoll); // todo: +STR modifier
    mob.takeDamage(dmg);

    // messages
    const verb = this.getAttackVerb(weapon);
    const thirdPersonVerb = verbToThirdPerson(verb);
    actorMessage = `<span class="${config.DMG_COLOR}">You ${verb} the ${mob.displayName} for ${dmg} damage!</span>`;
    roomMessage = `<span class="${config.DMG_COLOR}">The ${this.username} ${thirdPersonVerb} ${mob.displayName} for ${dmg} damage!</span>`;
  } else {
    actorMessage = `<span class="${config.MSG_COLOR}">You swing at the ${mob.displayName} but miss!</span>`;
    roomMessage = `<span class="${config.MSG_COLOR}">${this.username} swings at the ${mob.displayName} but misses!</span>`;
  }

  this.output(actorMessage);
  this.toRoom(roomMessage);
};

CharacterSchema.methods.processEndOfRound = function (round) {

  if (this.bleeding) {

    // take damage every number of rounds configured
    if (round % config.BLEED_ROUNDS === 0) {
      this.output('<span class="firebrick">You are bleeding!</span>');
      this.toRoom(`<span class="firebrick">${this.name} is bleeding out!</span>`);
      this.takeDamage(1);
      this.save();
    }
    //this.bleeding++;
  } else {

    // this is on a global 'timer' and probably should be changed to
    // track a counter for each character (every 4 rounds after you break of combat)
    if (!this.attackTarget && round % config.REGEN_ROUNDS === 0) {
      this.regen();
      this.save();
    }
  }

  if (this.hasState(characterStates.resting) && this.currentHP >= this.maxHP) {
    this.removeState(characterStates.resting);
    this.output('<span class="olive">You are fully healed.</span>');
  }

  // todo: may need to find a way to remove the incapacitated state
  // when the user gains HP above 0.... (no matter what method that happens in)
  if (this.currentHP > 0) {
    this.removeState(characterStates.incapacitated);
  }
};

CharacterSchema.methods.isIncapacitated = function () {
  return this.hasState(characterStates.incapacitated);
};

CharacterSchema.methods.regen = function () {
  // just a hack for now, only players regen.
  if (!this.user) return;

  if (this.currentHP < this.maxHP) {
    if (this.states.includes(characterStates.resting)) {
      // poor man's Math.clamp()
      this.currentHP = Math.min(Math.max(this.currentHP + 2, 0), this.maxHP);
    } else {
      this.currentHP++;
    }
    this.updateHUD();
  }
};

CharacterSchema.methods.die = function () {
  this.break();
  // regenerate user at coordinate location
  Room.getByCoords({ x: 0, y: 0, z: 0 }).then(room => {
    this.teleport(room.id);
    this.currentHP = this.maxHP;
    this.bleeding = false;
    this.output('\n<span class="red">You have died!</span>\n');
    this.output('<span class="yellow">You have been resurrected.</span>\n');
    this.updateHUD();
  });
};

CharacterSchema.methods.updateHUD = function () {
  const socket = socketUtil.getSocketByCharacterId(this.id);
  if (socket) {
    updateHUD(socket);
  }
};

CharacterSchema.methods.incapacitate = function () {
  this.break();
  this.setState(characterStates.incapacitated);
};

CharacterSchema.methods.takeDamage = function (damage) {
  const characterDrop = this.currentHP > 0;
  this.currentHP -= damage;
  if (this.currentHP <= 0) {
    if (characterDrop) {
      this.incapacitate();
      this.output('<span class="firebrick">You are incompacitated!</span>\n');
      this.toRoom(`<span class="firebrick">${this.name} drops to the ground!</span>\n`);
    }
    this.bleeding = 1;
  }
  this.updateHUD();
  if (this.currentHP <= -15) {
    this.die();
  }

  this.save();
};

CharacterSchema.methods.break = function () {
  this.attackInterval = undefined;
  this.lastAttack = undefined;
  this.attackTarget = undefined;
};

CharacterSchema.methods.move = function (dir) {

  const fromRoom = Room.getById(this.roomId);
  const socket = socketUtil.getSocketByCharacterId(this.id);

  return fromRoom.IsExitPassable(this, dir).then((exit) => {
    const toRoom = Room.getById(exit.roomId);
    this.break();

    if (socket) {
      const displayDir = Room.shortToLong(dir);
      if (this.isIncapacitated()) this.output(`You are dragged ${displayDir}...`);
      else if (this.sneakMode()) this.output(`You sneak ${displayDir}...`);
      else this.output(`You move ${displayDir}...`);
    }

    fromRoom.leave(this, dir, socket);
    const enterDir = Room.oppositeDirection(dir);
    toRoom.enter(this, enterDir, socket);

    let followers = socketUtil.getFollowers(socket.character.id);
    if (this.dragging) {
      const drag = socketUtil.getCharacterById(this.dragging);
      followers.push(drag);
    }

    followers.forEach(c => {
      c.move(dir);
    });

    return Promise.resolve(toRoom);
  });
};

CharacterSchema.methods.teleport = function (roomTarget) {

  // get by id or alias
  const room = Room.getById(roomTarget);
  if (!room) {
    return Promise.reject('Invalid roomId');
  }

  if (this.roomId === room.id) {
    return Promise.reject('Character is already here.');
  }

  // todo: remove the socket writes, as this method could be used
  // for different reasons, not all of which is an actual teleport.
  this.break();
  const socket = socketUtil.getSocketByCharacterId(this.id);

  //socketUtil.roomMessage(socket, `${this.name} vanishes!`, [socket.id]);
  if (socket) {
    socket.leave(this.roomId);
    socket.join(room.id);
  }

  this.roomId = room.id;

  // npcs don't save to database on every move
  if (socket) {
    this.save(err => { if (err) throw err; });
  }
  return Promise.resolve({
    charMessages: [{ charId: this.id, message: 'You teleport...\n' }],
    roomMessages: [{ roomId: roomTarget, message: `<span class="yellow">${this.name} appears out of thin air!</span>`, exclude: [this.id] }],
  });
};

CharacterSchema.methods.output = function (msg, options) {
  const socket = socketUtil.getSocketByCharacterId(this.id);
  if (socket) {
    let payload = { message: msg };
    if (options) {
      Object.assign(payload, options);
    }
    socket.emit('output', payload);
  }
  return msg;
};

CharacterSchema.methods.toRoom = function (msg, exclude) {
  let excludeArr = [this.id];
  if (Array.isArray(exclude)) {
    excludeArr = excludeArr.concat(exclude);
  }
  socketUtil.roomMessage(this.roomId, msg, excludeArr);
};

CharacterSchema.methods.getFollowers = function () {
  return socketUtil.getFollowers(this.id);
};

CharacterSchema.methods.getPartyCharacters = function () {
  let followers = [];
  if (this.leader) {
    const leader = socketUtil.getCharacterById(this.leader);
    followers.push(leader);
    followers = followers.concat(leader.getFollowers());
  } else {
    followers.push(this);
    followers = followers.concat(this.getFollowers());
  }
  return Promise.resolve(followers);
};

CharacterSchema.methods.toParty = function (msg) {
  return this.getPartyCharacters().then(characters => {
    characters.forEach(c => c.output(msg));
    return Promise.resolve();
  });
};

CharacterSchema.methods.status = function () {

  let status = healthStatus.UNHARMED;

  const quotient = this.currentHP / this.maxHP;
  if (quotient <= 0) {
    status = `<span class="red">${healthStatus.INCAPACITATED}</span>`;
  }
  else if (quotient <= 0.33) {
    status = `<span class="firebrick">${healthStatus.SEVERELY_WOUNDED}</span>`;
  }
  else if (quotient <= 0.66) {
    status = `<span class="yellow">${healthStatus.MODERATELY_WOUNDED}</span>`;
  }
  else if (quotient < 1) {
    status = `<span class="olive">${healthStatus.LIGHTLY_WOUNDED}</span>`;
  }
  return status;
};

CharacterSchema.methods.gossip = function (msg) {
  let safeMessage = msg.replace(/</g, '&lt;');
  safeMessage = safeMessage.replace(/>/g, '&gt;');
  const output = `<span class="silver">${this.name} gossips: </span><span class="mediumOrchid">${safeMessage}</span>`;
  global.io.to('gossip').emit('output', { message: output });
  return Promise.resolve(output);
};

//============================================================================
// Character States - this may get moved to a sub-schema
//============================================================================
CharacterSchema.methods.setState = function (state) {
  if (!Object.values(characterStates).includes(state)) {
    return;
  }
  if (!this.states.includes(state)) {
    this.states.push(state);
    this.updateHUD();
    return true;
  }
  return;
};

CharacterSchema.methods.hasState = function (state) {
  return this.states.includes(state);
};

CharacterSchema.methods.removeState = function (state) {
  if (!Object.values(characterStates).includes(state)) {
    return;
  }

  const sIndex = this.states.findIndex(s => s === state);
  if (sIndex > -1) {
    const removed = this.states.splice(sIndex, 1);
    this.updateHUD();
    return removed;
  }

  return;
};

CharacterSchema.methods.sneakMode = function () {
  return this.hasState(characterStates.sneaking);
};

/**
 * Checks if a command being executed affects a character's current states.
 * @param {Character} character
 * @param {Object} command
 * @returns {Boolean} - Whether or not the command can continue.
 */
CharacterSchema.methods.processStates = function (command) {

  // if any state restricts the action, we will let that trump deactivating other states.
  // For this reason, we must check all states for action prevention first.
  const restrictStates = this.states.filter(s => s.mode === stateMode.RESTRICT);
  for (let state of restrictStates) {
    if (!state.commandCategories.includes(command.category)) {
      if (state.message) {
        // treat a regular string as a template literal
        const msg = new Function(`return \`${state.message}\`;`).call(this);
        this.output(msg);
      }

      // since the action is blocked, we can return immediately
      return false;
    }
  }

  // multiple states can be deactivated in one action, so we must loop through
  // entire array and remove states as they become deactivated.
  const deactivateStates = this.states.filter(s => s.mode === stateMode.DEACTIVATE);
  for (let i = 0; i < deactivateStates.length; i++) {
    let state = deactivateStates[i];

    if (!state.commandCategories.includes(command.category)) {
      if (state.message) {
        let msg = new Function(`return \`${state.message}\`;`).call(this);
        this.output(msg);
      }
      deactivateStates.splice(i, 1);
      i--;
      this.removeState(state);
    }
  }

  this.updateHUD();
  return true;
};

export default CharacterSchema;
