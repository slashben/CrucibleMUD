import mongoose from 'mongoose';
import socketUtil from '../core/socketUtil';

const itemTypeEnum = [
  'item',
  'key',
];

const ItemSchema = new mongoose.Schema({
  name: String,
  desc: String,
  type: {
    type: String,
    enum: itemTypeEnum,
  },
  hidden: Boolean,
  range: String,
  fixed: Boolean,
  equipSlots: [String],
  damage: String,
  damageType: String,
  speed: String,
  bonus: String,
});

ItemSchema.methods.getDesc = function (character) {
  const socket = socketUtil.getSocketByCharacterId(character.id);
  let output = this.desc;
  if (socket.character.user.debug) {
    output += `\nItem ID: ${this.id}`;
  }
  return output;
};

export default ItemSchema;
