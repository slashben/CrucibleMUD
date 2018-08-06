
export default {
  catalog: [
    {
      name: 'shortsword',
      displayName: 'short sword',
      desc: 'an iron short sword',
      type: 'item',
      range: 'melee',
      equip: 'mainHand',  //mainHand/offHand/bothHand/eitherHand, head, etc
      damage: '1d6 0',  //die roll + modifier
      damageType: 'slashing',  //piercing, slashing, bludgeoning
      speed: 0,  //scale from -1(slowest) to 1(fastest)
      bonus: 'damage + 0', //stat + modifier
    },
    {
      name: 'jadekey',
      displayName: 'jade key',
      desc: 'a key made out of jade',
      type: 'key',
    },
    {
      name: 'torch',
      displayName: 'torch',
      desc: 'a flaming stick',
      type: 'item',
      range: 'melee',
      equip: 'offHand',  //mainHand/offHand/bothHand/eitherHand, head, non, etc
      damage: '1d2 0',  //die roll (+/-)modifier
      damageType: 'bludgeoning',  //piercing, slashing, bludgeoning
      speed: -.5,  //scale from -1(slowest) to 1(fastest)
      bonus: 'damage + 1d4 fire', //stat + modifier
    },
    {
      name: 'sign',
      fixed: true,
      displayName: 'sign',
      desc: 'The sign reads \'Hi, I\'m a sign.\'',
      type: 'item',
    },
  ],
};