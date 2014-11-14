var walkSync = require('walk-sync');
var Petal = require('petal');
var fs = require('fs');
var writeFile = require('broccoli-file-creator');
var helpers = require('broccoli-kitchen-sink-helpers');

module.exports = StubGenerator;

function StubGenerator(inputTree) {
  if (!(this instanceof StubGenerator)) {
    return new StubGenerator(inputTree);
  }
  this.inputTree = inputTree;
  this.petalCache = {};
}

StubGenerator.prototype.cleanup = function(){};

StubGenerator.prototype.read = function(readTree) {
  var cache = this.petalCache;
  return readTree(this.inputTree).then(function(srcDir){
    var paths = walkSync(srcDir);
    var stubs = {};
    paths.forEach(function (relativePath) {
      if (relativePath.slice(-3) === '.js') {
        gatherStubs(srcDir, relativePath, stubs, cache);
      }
    });
    return writeFile('browserify_stubs.js', generate(stubs)).read(readTree);
  });
};

function gatherStubs(srcDir, relativePath, stubs, cache) {
  var src = fs.readFileSync(srcDir + '/' + relativePath);
  var key = helpers.hashStrings([relativePath, src]);

  if (cache[key]) {
    var len = cache[key].length;
    for (var i=0; i<len; i++) {
      stubs[cache[key][i]] = true;
    }
    return;
  }

  var cacheEntry = cache[key] = [];
  var petal = new Petal(relativePath, src);
  Object.keys(petal.imports).forEach(function(key){
    if (key.slice(0,4) === 'npm:') {
      var moduleName = key.slice(4);
      stubs[moduleName] = true;
      cacheEntry.push(moduleName);
    }
  });
}

function generate(stubs) {
  return Object.keys(stubs).map(function(moduleName){
    return "define('npm:" +
      moduleName +
      "', function(){ return { default: require('" +
      moduleName +
      "')};})";
  }).join("\n");
}
