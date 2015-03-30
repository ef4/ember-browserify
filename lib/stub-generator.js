var walkSync = require('walk-sync');
var esprima = require('esprima');
var fs = require('fs');
var helpers = require('broccoli-kitchen-sink-helpers');
var RSVP = require('rsvp');
var rimraf = RSVP.denodeify(require('rimraf'));
var symlinkOrCopy = require('symlink-or-copy');
var CachingWriter = require('broccoli-caching-writer');

module.exports = CachingWriter.extend({
  init: function(){
    this.enforceSingleInputTree = true;

    // The importsCache lets us avoid re-parsing individual files that
    // haven't changed.
    this.importsCache = {};

    // The stubsCache lets us avoid re-running browserify when the set
    // of included modules hasn't changed.
    this.stubsCache = null;
  },

  read: function(readTree) {
    var self = this;
    return readTree(this.inputTrees[0]).then(function(srcDir){
      var paths = walkSync(srcDir);
      var stubs = {};
      var updateCacheResult;
      paths.forEach(function (relativePath) {
        if (relativePath.slice(-3) === '.js') {
          gatherStubs(srcDir, relativePath, stubs, self.importsCache);
        }
      });
      if (!sameStubs(stubs, self.stubsCache)) {
        self.stubsCache = stubs;
        updateCacheResult = self.updateCache(srcDir, self.getCleanCacheDir());
      }
      return updateCacheResult;
    }).then(function(){
      return rimraf(self._destDir);
    }).then(function(){
      symlinkOrCopy.sync(self.getCacheDir(), self._destDir);
    }).then(function(){
      return self._destDir;
    });
  },

  updateCache: function(srcDir, destDir) {
    fs.writeFileSync(destDir + '/browserify_stubs.js', generate(this.stubsCache));
    return destDir;
  }
});


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
  var imports = parseImports(src);
  Object.keys(imports).forEach(function(moduleName){
    stubs[moduleName] = true;
    cacheEntry.push(moduleName);
  });
}

function generate(stubs) {
  return Object.keys(stubs).map(function(moduleName){
    return "define('npm:" +
      moduleName +
      "', function(){ return { 'default': require('" +
      moduleName +
      "')};})";
  }).join("\n");
}

function sameStubs(a, b) {
  if (!a || !b) {
    return false;
  }
  var keys = Object.keys(a);
  for (var i=0; i < keys.length; i++) {
    if (!b[keys[i]]) {
      return false;
    }
  }
  keys = Object.keys(b);
  for (i=0; i < keys.length; i++) {
    if (!a[keys[i]]) {
      return false;
    }
  }
  return true;
}

function forEachNode(node, visit) {
  if (node && typeof node === 'object') {
    visit(node);
    var keys = Object.keys(node);
    for (var i=0; i < keys.length; i++) {
      forEachNode(node[keys[i]], visit);
    }
  }
}

function parseImports(src) {
  var imports = {};
  forEachNode(esprima.parse(src), function(entry) {
    if (entry.type === 'ImportDeclaration') {
      var source = entry.source.value;
      if (source.slice(0,4) === 'npm:') {
        if (entry.kind === 'named') {
          throw new Error("ember-browserify doesn't support named imports (you tried to import " + entry.specifiers[0].id.name +  " from " + source);
        }
        imports[source.slice(4)] = true;
      }
    }
  });
  return imports;
}
