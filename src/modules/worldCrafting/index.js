import createAreaCommand from './commands/createAreaCommand';
import createCommand from './commands/createCommand';
import createDoorCommand from './commands/createDoorCommand';
import setCommand from './commands/setCommand';
import spawnerCommand from './commands/spawnerCommand';

import createAreaAction from './actions/createAreaAction';
import createAction from './actions/createAction';
import createDoorAction from './actions/createDoorAction';
import setAction from './actions/setAction';
import spawnerAction from './actions/spawnerAction';

export const commands = [
  createAreaCommand,
  createCommand,
  createDoorCommand,
  setCommand,
  spawnerCommand,
];

export const actions = [
  createAreaAction,
  createAction,
  createDoorAction,
  setAction,
  spawnerAction,
];

export default {
  commands,
  actions,
};