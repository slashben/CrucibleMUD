'use strict';

if (!String.prototype.format) {
  String.prototype.format = function () {
    const args = arguments;
    return this.replace(/{(\d+)}/g, (match, number) => (typeof args[number] !== 'undefined') ? args[number] : match);
  };
}

if (!Object.prototype.getKeyByValue) {
  Object.defineProperty(Object.prototype, 'getKeyByValue', {
    value(value) {
      for (const prop in this) {
        if (this.hasOwnProperty(prop)) {
          if (this[prop] === value) {
            return prop;
          }
        }
      }
    },
    enumerable: false,
  });
}

if (!Array.prototype.GetFirstByDisplayName) {
  Array.prototype.GetFirstByDisplayName = function (name) {
    if (!name) return undefined;
    const item = this.find(i => i.displayName.toLowerCase() === name.toLowerCase());
    return item;
  };
}

/* remove an item from an array if you already have a reference to it */
if (!Array.prototype.remove) {
  Array.prototype.remove = function (obj) {
    var index = this.findIndex(i => i === obj);
    if (index !== -1) {
      this.splice(index, 1);
    }
  };
}

/* splices the first item it finds and returns it */
Array.prototype.spliceFirst = function(callback) {
  var i = this.length;
  while (i--) {
    if (callback(this[i], i)) {
      return this.splice(i, 1);
    }
  }
};