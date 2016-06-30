var Plugin = require('broccoli-plugin');
var FSTree = require('fs-tree-diff');
var walkSync = require('walk-sync');
var Stubs = require('./stubs');
var fs = require('fs');
var md5Hex = require('md5-hex');
var debug = require('debug')('ember-browserify:stub-generator:');

module.exports = StubGenerator;
function StubGenerator(inputTree, options) {
  if (!(this instanceof StubGenerator)) {
    return new StubGenerator([inputTree], options);
  }

  if (Array.isArray(inputTree) || !inputTree) {
    throw new Error('Expects one inputTree');
  }

  Plugin.call(this, [inputTree], options);
  this._persistentOutput = true;

  // setup persistent state
  this._previousTree = new FSTree();
  this.stubs = new Stubs();

  this._fileToChecksumMap = {};
}

StubGenerator.prototype = Object.create(Plugin.prototype);
StubGenerator.prototype.constructor = StubGenerator;
StubGenerator.prototype.build = function() {
  var start = Date.now();
  var inputPath = this.inputPaths[0];
  var previous  = this._previousTree;

  // get patchset
  var input = walkSync.entries(inputPath, [ '**/*.js' ]);

  debug('input: %d', input.length);

  var next = this._previousTree = FSTree.fromEntries(input);
  var patchset = previous.calculatePatch(next);

  debug('patchset: %d', patchset.length);

  var applyPatch = Date.now();

  // process patchset
  patchset.forEach(function(patch) {
    var operation = patch[0];
    var path      = patch[1];
    var fullPath  = inputPath + '/' + path;

    switch (operation) {
      case 'unlink': this.stubs.delete(fullPath); break;
      case 'create':
      case 'change': this.stubs.set(fullPath, fs.readFileSync(fullPath)); break;
    }
  }, this);

  debug('patched applied in: %dms', Date.now() - applyPatch);

  // apply output
  this.writeFileIfContentChanged(this.outputPath + '/browserify_stubs.js', this.stubs.toAMD());

  debug('build in %dms', Date.now() - start);
};

StubGenerator.prototype.writeFileIfContentChanged = function(fullPath, content) {
  var previous = this._fileToChecksumMap[fullPath];
  var next = md5Hex(content);

  if (previous === next) {
    debug('cache hit, no change to: %s', fullPath);
    // hit
  } else {
    debug('cache miss, write to: %s', fullPath);
    fs.writeFileSync(fullPath, content);
    this._fileToChecksumMap[fullPath] = next; // update map
  }
};
