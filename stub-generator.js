var walkSync = require('walk-sync');
var Petal = require('petal');
var fs = require('fs');
var writeFile = require('broccoli-file-creator');

module.exports = StubGenerator;

function StubGenerator(inputTree, modules) {
  if (!(this instanceof StubGenerator)) {
    return new StubGenerator(inputTree, modules);
  }
  this.inputTree = inputTree;
  this.modules = modules;
  this.stubs = {};
}

StubGenerator.prototype.cleanup = function(){};

StubGenerator.prototype.read = function(readTree) {
  var self = this;
  return readTree(this.inputTree).then(function(srcDir){
    var paths = walkSync(srcDir);
    paths.forEach(function (relativePath) {
      if (relativePath.slice(-3) === '.js') {
        var petal = new Petal(relativePath, fs.readFileSync(srcDir + '/' + relativePath));
        Object.keys(petal.imports).forEach(function(key){
          if (key.slice(0,4) === 'npm:') {
            var moduleName = key.slice(4);
            self.modules[moduleName] = [ 'default' ];
            self.stubs[moduleName] = true;
          }
        });
      }
    });
    return writeFile('browserify_stubs.js', self.generate()).read(readTree);
  });
};

StubGenerator.prototype.generate = function() {
  return Object.keys(this.stubs).map(function(moduleName){
    return "define('npm:" +
      moduleName +
      "', function(){ return { default: require('" +
      moduleName +
      "')};})";
  }).join("\n");
};
