var walkSync = require('walk-sync');
var Petal = require('petal');
var fs = require('fs');
var writeFile = require('broccoli-file-creator');

module.exports = StubGenerator;

function StubGenerator(inputTree) {
  if (!(this instanceof StubGenerator)) {
    return new StubGenerator(inputTree);
  }
  this.inputTree = inputTree;
}

StubGenerator.prototype.cleanup = function(){};

StubGenerator.prototype.read = function(readTree) {
  var self = this;
  return readTree(this.inputTree).then(function(srcDir){
    var paths = walkSync(srcDir);
    var stubs = {};
    paths.forEach(function (relativePath) {
      if (relativePath.slice(-3) === '.js') {

        var petal = new Petal(relativePath, fs.readFileSync(srcDir + '/' + relativePath));
        Object.keys(petal.imports).forEach(function(key){
          if (key.slice(0,4) === 'npm:') {
            var moduleName = key.slice(4);
            stubs[moduleName] = true;
          }
        });
      }
    });
    return writeFile('browserify_stubs.js', self.generate(stubs)).read(readTree);
  });
};

StubGenerator.prototype.generate = function(stubs) {
  return Object.keys(stubs).map(function(moduleName){
    return "define('npm:" +
      moduleName +
      "', function(){ return { default: require('" +
      moduleName +
      "')};})";
  }).join("\n");
};
