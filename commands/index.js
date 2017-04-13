'use strict';

const actionHandler = require('../actionHandler');

let handlers = [];
//todo: perhaps this should live in a config file?
let defaultCommand;

const normalizedPath = require('path').join(__dirname);

console.log('path:', normalizedPath);

require('fs').readdirSync(normalizedPath).forEach(function(file) {
  if (file != 'index.js') {
    let module = require('./' + file);
    
    // initialization checks
    if(!module.name) throw `command ${file} missing name!`;
    if(!module.dispatch) throw `command ${file} missing dispatch!`;
    if(!module.execute) throw `command ${file} missing execute!`;
    if(!module.patterns) throw `command ${file} missing patterns!`;
    if(!module.help) throw `command ${file} missing help!`;

    handlers.push(module);
  }

  defaultCommand = handlers.find(h => h.name === "say");
});

// when loading the action do some basic checks and throw exceptions if all the required properties are not met


module.exports = {
  Dispatch(socket, input) {
    input = input.trim();

    // check if input string matches any of our matching patterns.
    // then call the handler with the input, socket
    for (let h = 0; h < handlers.length; h++) {
      // todo: if we find we need to use match later to pull things out of the string,
      // then just update this to do a match instead of a test. No sense doing it twice.
      for (let p = 0; p < handlers[h].patterns.length; p++) {
        let match = input.match(handlers[h].patterns[p]);
        if (match) {
          if(!handlers[h].admin || socket.user.admin) {
            handlers[h].dispatch(socket, match);
            return;
          }
        }
      }
    }

    // todo: perhaps move the actions into their own command handler?
    // using regex to parse that many commands on every enter press may be a bad idea...
    
    const actionRegex = /^(\w+)\s?(.*)$/i;
    let match = input.match(actionRegex);
    if(match) {
      let action = match[1];
      let username = match[2];
      var actionFound = actionHandler.actionDispatcher(socket, action, username);
      if(actionFound) {
        return;
      }
    }

    // when a command is not found, it defaults to "say"
    defaultCommand.execute(socket, input);
  }
};
