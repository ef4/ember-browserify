'use strict';
var fs = require('fs');

module.exports = Loader;
function Loader() {
  this.entries = {};
  this.setGlobalDefine();
}

Loader.prototype.load = function(path) {
  require(path);
};

Loader.prototype.unload = function(_path) {
  var path = fs.realpathSync(_path);
  delete require('module')._cache[path];
  delete require.cache[path];
  delete require('module')._cache[_path];
  delete require.cache[_path];
  this.entries = {};
};

Loader.prototype.reload = function(path) {
  this.unload(path);
  this.load(path);
};

Loader.prototype.require = function(name) {
  if (!(name in this.entries)) {
    throw new TypeError('no such module: `' + name + '`');
  }

  return this.entries[name]();
};

Loader.prototype.setGlobalDefine = function() {
  global.define = function(name, callback) {
    this.entries[name] = callback;
  }.bind(this);
};

Loader.prototype.teardown = function() {
  this.entries = undefined;
  delete global.define;
};

