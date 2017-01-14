var dirUtil = require('./direction');
var globals = require('./globals');


module.exports = function(io) {
  var adminUtil = require('./admin')(io);

  function Who(socket) {

    var usernames = [];
    for (var socketId in io.sockets.sockets) {
      //console.log("Socket: " + socket);
      if (globals.USERNAMES[socketId]) {
        usernames.push(globals.USERNAMES[socketId]);
      }
    }

    var output = '<span class="cyan"> -=- ' + usernames.length + ' Players Online -=-</span><br />';
    output += '<div class="mediumOrchid">' + usernames.join('<br />') + '</div>';
    socket.emit('output', { message: output });
  };

  function UsersInRoom(socket) {
    var clients = io.sockets.adapter.rooms[socket.room._id].sockets;

    // remove current user
    var otherUsers = Object.keys(clients).filter(function(socketId) {
      return socketId != socket.id;
    });

    var usernames = otherUsers.map(function(socketId) {
      return globals.USERNAMES[socketId];
    });
    return usernames.join('<span class="mediumOrchid">, </span>');
  };

  function CommandDispatch(socket, data) {

    // split on whitespace
    var command = data.value.split(/\s+/);
    var action = command[0].toLowerCase();

    // on blank command string, just look.
    if (command.length == 1 && action == '') {
      Look(socket, true);
      return;
    }

    if (dirUtil.ValidDirectionInput(action)) {
      Move(socket, action);
      return;
    }

    switch (action) {
      case 'h':
      case '?':
      case 'help':
        Help(socket);
        break;
      case 'l':
      case 'look':
        Look(socket);
      case 'attack':
        break;
      case 'create':
        if (socket.admin) {
          var dir = command.length > 2 ? command[2] : '';
          adminUtil.CreateDispatch(socket, command, function() {
            socket.broadcast.to(socket.room._id).emit('output', { message: globals.USERNAMES[socket.id] + ' has created a room to the ' + dirUtil.DisplayDirection(dir) + '.' });
            Look(socket);
          });
        }
        break;
      case 'set':
        if (socket.admin) {
          adminUtil.SetDispatch(socket, command, data.value, function() {
            socket.broadcast.to(socket.room._id).emit('output', { message: globals.USERNAMES[socket.id] + ' has altered the fabric of reality.' });
            Look(socket);
          });
        }
        break;
      case 'gossip':
      case 'gos':
        Gossip(socket, data.value.replace(/^gos/i, '').replace(/^gossip/i, ''));
        break;
      case 'who':
        Who(socket);
        break;
      default:
        Say(socket, data.value);
    }
  }

  function Say(socket, message) {
    message = message.replace(/</g, '&lt;');
    message = message.replace(/>/g, '&gt;');

    // to sending socket
    socket.emit('output', { message: 'You say "' + message + '"' });

    // everyone else
    socket.broadcast.to(socket.room._id).emit('output', { message: globals.USERNAMES[socket.id] + ' says "' + message + '"' });
  }

  function Gossip(socket, message) {
    message = message.replace(/</g, '&lt;');
    message = message.replace(/>/g, '&gt;');

    var output = '<span class="silver">' + globals.USERNAMES[socket.id] + ' gossips: </span><span class="mediumOrchid">' + message + '</span>';
    io.emit('output', { message: output });
  }

  function Move(socket, dir) {
    dir = dir.toLowerCase();
    dir = dirUtil.LongToShort(dir);
    var roomsCollection = globals.DB.collection('rooms');
    roomsCollection.find({ _id: socket.room.exits[dir] }).toArray(function(err, docs) {
      if (docs.length == 0) {
        socket.emit('output', { message: "There is no exit in that direction!" });
        return;
      }

      socket.broadcast.to(socket.room._id).emit('output', { message: globals.USERNAMES[socket.id] + ' has left to the ' + dirUtil.DisplayDirection(dir) + '.' });
      socket.leave(socket.room._id);

      socket.room = docs[0];
      socket.join(socket.room._id);
      socket.broadcast.to(socket.room._id).emit('output', { message: globals.USERNAMES[socket.id] + ' has entered from the ' + dirUtil.DisplayDirection(dirUtil.OppositeDirection(dir)) + '.' });

      socket.emit('output', { message: dirUtil.Feedback(dir) });
      Look(socket);
    });

  }

  function Help(socket) {
    var output = '<pre><span class="cyan">Commands:</span><br />';
    output += '  <span class="mediumOrchid">Movement</span> <span class="purple">-</span> n,s,e,w,u,d,ne,nw,sw,se<br />';
    output += '      <span class="mediumOrchid">look</span> <span class="purple">-</span> Look at current room.<br />';
    output += '    <span class="mediumOrchid">gossip</span> <span class="purple">-</span> Send messages to all connected players.<br />';
    output += '       <span class="mediumOrchid">who</span> <span class="purple">-</span> List all online players.';
    output += '</pre><br /><br />';

    if (socket.admin) {
      output += '<pre><span class="cyan">Admin commands:</span><br />';
      output += '  <span class="mediumOrchid">create room &lt;dir&gt;</span><br />';
      output += '  <span class="mediumOrchid">set title &lt;new room title&gt;</span><br />';
      output += '  <span class="mediumOrchid">set desc &lt;new room desc&gt;</span><br /></pre>';
    }
    socket.emit('output', { message: output });
  }

  function Look(socket, short) {
    var exits = socket.room.exits || {};

    var output = '<span class="cyan">' + socket.room.title + '</span>\n';

    if (!short) {
      output += '<span class="silver">' + socket.room.description + '</span>\n';
    }

    var otherUsers = UsersInRoom(socket);
    if (otherUsers) {
      output += '<span class="purple">Also here: <span class="teal">' + otherUsers + '</span>.</span>\n';
    }

    if (Object.keys(exits).length > 0) {
      output += '<span class="green">Exits: ' + Object.keys(exits).map(function(dir) {
        return dirUtil.DisplayDirection(dir)
      }).join(', ') + '</span>\n';
    }

    socket.emit("output", { message: output });
  }

  // public functions
  return {
    CommandDispatch: CommandDispatch,
    Look: Look
  }
}
