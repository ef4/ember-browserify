var Plugin = require('broccoli-plugin');
var FSTree = require('fs-tree-diff');
var walkSync = require('walk-sync');
var Stubs = require('./stubs');
var fs = require('fs');
var md5Hex = require('md5-hex');
var debug = require('debug')('ember-browserify:stub-generator:');
var importsFor = require('./imports-for');

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
  var outputPath = this.outputPath;
  var previous  = this._previousTree;

  // get patchset
  var input = walkSync.entries(inputPath);

  debug('input: %d', input.length);

  var next = this._previousTree = FSTree.fromEntries(input);
  var patchset = previous.calculatePatch(next);

  debug('patchset: %d', patchset.length);

  var applyPatch = Date.now();

  // process patchset
  patchset.forEach(function(patch) {
    var operation = patch[0];
    var path      = patch[1];
    var fullInputPath  = inputPath + '/' + path;
    var fullOutputPath = outputPath + '/' + path;

    switch (operation) {
      case 'unlink':
        if (!/\.js$/.test(path)) { break; }
        // TODO: only add files that required rewriting
        fs.unlinkSync(fullOutputPath);
        this.stubs.delete(fullInputPath);
        break;
      case 'mkdir':  fs.mkdirSync(fullOutputPath); break;
      case 'rmdir':  fs.rmdir(fullOutputPath); break;
      case 'create':
      case 'change':
        if (!/\.js$/.test(path)) { break; }


        var content = fs.readFileSync(fullInputPath, 'UTF8');
        var version = '3.0.0'; // TODO: get real identifier
        var data = {};
        var imports = importsFor(content);

        Object.keys(imports).forEach(function(key) {
          data[key] = {
            version: version
          };
        });

        // TODO: only add files that required rewriting
        fs.writeFileSync(fullOutputPath, rewriteImports(content, data));

        this.stubs.set(fullInputPath, data);

        break;
    }
  }, this);

  debug('patched applied in: %dms', Date.now() - applyPatch);

  // apply output
  this.writeFileIfContentChanged(this.outputPath + '/browserify_stubs.js', this.stubs.toAMD());

  debug('build in %dms', Date.now() - start);
};

function rewriteImports(content, data) {
  // TODO: real AST printing might be a good plan..
  Object.keys(data).forEach(function(name) {
    var version = data[name].version;
    content = content.replace(new RegExp('["]npm:' + name + '["]', 'g'), '"npm:' + name + '@' + version + '"');
    content = content.replace(new RegExp('[\']npm:' + name + '[\']', 'g'), '\'npm:' + name + '@' + version + '\'');
  });
  return content;
}

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
