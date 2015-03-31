var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var helpers = require('broccoli-kitchen-sink-helpers');
var RSVP = require('rsvp');
var CoreObject = require('core-object');
var mapSeries = require('promise-map-series');
var merge    = require('lodash-node/modern/objects/merge');
var rimraf = require('rimraf');
var symlinkOrCopy = require('symlink-or-copy');
var quickTemp = require('quick-temp');
var mkdirp = require('mkdirp');

module.exports = CoreObject.extend({
  init: function(inputTree, options){
    if (!options) {
      options = {};
    }
    this.inputTree = inputTree;
    this.root = options.root;
    this.inFile = options.inFile || 'browserify_stubs.js';
    this.browserifyOptions = options.browserifyOptions;
    this.enableSourcemap = options.enableSourcemap;
    this.fullPaths = typeof options.fullPaths !== 'undefined' ? options.fullPaths : true;
    this.outputFile = options.outputFile || 'browserify/browserify.js';
    this.cache = {};
    quickTemp.makeOrRemake(this, '_inputStaging');
    quickTemp.makeOrRemake(this, '_destDir');
  },

  cleanup: function() {
    if (this._destDir) {
      rimraf.sync(this._destDir);
    }
    if (this._inputStaging) {
      rimraf.sync(this._inputStaging);
    }
    if (this._destDir) {
      rimraf.sync(this._outputCache);
    }
  },

  read: function (readTree) {
    var self = this;
    return readTree(this.inputTree).then(function(inDir){
      return self.checkCache(inDir).then(function(cacheValid){
        if (!self._outputCache || !cacheValid) {
          return self._rebuild(inDir);
        }
      });
    }).then(function(){
      rimraf.sync(self._destDir);
      symlinkOrCopy.sync(self._outputCache, self._destDir);
      return self.watchNodeModules(readTree).then(function(){
        return self._destDir;
      });
    });
  },

  _rebuild: function(inDir){
    this._watchModules = Object.create(null);

    // _inputStaging needs to stay at the same path, because the
    // browserify bundler uses it as a fixed baseDir.
    rimraf.sync(this._inputStaging);
    mkdirp.sync(this._inputStaging);

    symlinkOrCopy.sync(path.join(inDir, this.inFile), path.join(this._inputStaging, this.inFile));
    quickTemp.makeOrRemake(this, '_outputCache');
    return this.updateCache(this._outputCache);
  },

  bundler: function() {
    if (!this._bundler) {
      this._bundler = this.makeBundler();
    }
    return this._bundler;
  },

  makeBundler: function() {
    var self = this;
    var opts = merge({
      cache: this.cache,
      packageCache: {},
      fullPaths: this.fullPaths,
      basedir: this._inputStaging,
      debug: this.enableSourcemap
    }, this.browserifyOptions);

    var b = browserify(opts);
    ['transforms', 'externals', 'ignores', 'includes'].forEach(function(thing) {
      if (!opts[thing]) { return; }
      opts[thing].forEach(function(args){
        if (!Array.isArray(args)) {
          args = [args];
        }
        // If we leave it up to browserify to load named transform
        // modules, it will load them relative to the discovered
        // source, not relative to us. So we do it here instead.
        if (thing === 'transforms' && typeof(args[0]) === 'string') {
          args[0] = require(args[0]);
        }
        b = b[thing.replace(/s$/, '')].apply(b, args);
      });
    });
    b.add('./' + self.inFile);

    b.on('package', function(pkg){
      // browserify *used to* reliably put the package's directory in
      // pkg.__dirname. But as of browser-resolve 1.7.0 that isn't
      // true, and we sometimes get a value here like
      // '/path/to/your-module/index' instead of
      // '/path/to/your-module'. So we do our own checking.
      var pkgDir = pkg.__dirname;
      var stat;
      try {
        stat = fs.statSync(pkgDir);
      } catch(err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
      if (!stat || !stat.isDirectory()) {
        pkgDir = path.dirname(pkgDir);
      }
      self._watchModules[pkgDir] = true;
    });

    b.on('dep', function (dep) {
      if (typeof dep.id === 'string') {
        self.cache[dep.id] = dep;

        // Even though we have a dep.source field available, we need
        // to reread the file as it appears on disk, because
        // dep.source is post-transformed.
        var filename = dep.file;
        if (filename.slice(0,1) === '.') {
          filename = path.join(self._inputStaging, filename);
        }
        dep.hash = helpers.hashStrings([fs.readFileSync(filename)]);
      }
    });
    return b;
  },

  updateCache: function(destDir) {
    var outPath = path.join(destDir, this.outputFile);
    var self = this;
    fs.mkdirSync(path.dirname(outPath));
    return new RSVP.Promise(function (resolve, reject) {
      self.bundler().bundle(function (err, data) {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(outPath, data);
          resolve(destDir);
        }
      });
    });
  },

  watchNodeModules: function(readTree) {
    var self = this;
    return mapSeries(Object.keys(self._watchModules), function(dir){
      if (self.normalizePath(dir) !== self.normalizePath(self.root)){
        return readTree(dir);
      }
    });
  },

  // Changes path drive-letter to lowercase for Windows
  normalizePath: function(path) {
    return (path && path.match(/^[a-z]:\\/i)) ? path.charAt(0).toLowerCase() + path.slice(1) : path;
  },

  // Due to the way CJS dependencies work, the appearance of a new
  // file in our input trees doesn't invalidate our cache -- because
  // unless one of the existing files changes, nobody depends on the
  // new file.
  //
  // Therefore we can iterate through only the files we already have
  // in cache.
  checkCache: function(inDir) {
    var file, entry;
    var ids = Object.keys(this.cache);
    var cache = this.cache;
    var cacheValid = true;

    for (var i=0; i<ids.length; i++) {
      entry = cache[ids[i]];
      if (!entry.file) {
        console.log(JSON.stringify(entry, null, 2));
      }
      if (entry.file.slice(0,1) === '.') {
        file = path.join(inDir, entry.file);
      } else {
        file = entry.file;
      }
      if (hashFile(file) !== entry.hash) {
        delete cache[entry.id];
        cacheValid = false;
      }
    }
    return RSVP.resolve(cacheValid);
  }
});

function hashFile(file) {
  var buf;
  try {
    buf = fs.readFileSync(file);
    return helpers.hashStrings([buf]);
  } catch(err) {
    return null;
  }
}
