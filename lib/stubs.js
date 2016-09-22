module.exports = Stub;
var debug = require('debug')('ember-browserify:stubs');

function Stub() {
  this._isDirty = true;
  this._map = {};
  this.resetStats();
}

Stub.prototype.resetStats = function() {
  this._stats = {
    deletions: 0,
    sets: 0,
    importTime: 0
  };
};

Stub.prototype.delete = function(fullPath) {
  this._stats.deletions++;

  if (fullPath in this._map) {
    delete this._map[fullPath];
    this._isDirty = true;
  }
};

Stub.prototype.set = function(fullPath, imports) {
  this._isDirty = true;
  var start = Date.now();
  this._map[fullPath] = imports;
  this._stats.importTime += (Date.now() - start);
};

Stub.prototype.toAMD = function() {
  debug("%o", this._stats);
  debug("isDirty", this._dirty);
  this.resetStats();

  if (this._isDirty === false) {
    return this._amd;
  }

  this._isDirty = false;

  var imports = {};

  // find unique modules
  Object.keys(this._map).forEach(function(filePath) {
    (Object.keys(this._map[filePath] || {})).forEach(function(moduleName) {
      imports[moduleName] = this._map[filePath][moduleName];
    }, this);
  }, this);

  // generate stub
  this._amd = Object.keys(imports).sort().map(function(moduleName) {
    var version = imports[moduleName].version;
    return "define('npm:" + moduleName + '@' + version + "', function(){ return { 'default': require('" + moduleName + "')};})";
  }).join("\n");

  return this._amd;
};
