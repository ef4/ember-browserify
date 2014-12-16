var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
//var helpers = require('broccoli-kitchen-sink-helpers');
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
    quickTemp.makeOrRemake(this, '_inputStaging');
  },

  cleanup: function() {
    if (this._destDir) {
      rimraf.sync(this._destDir);
    }
    if (this._inputStaging) {
      rimraf.sync(this._inputStaging);
    }
  },

  read: function (readTree) {
    var self = this;
    this._watchModules = Object.create(null);

    quickTemp.makeOrRemake(this, '_destDir');
    rimraf.sync(this._inputStaging);
    mkdirp.sync(this._inputStaging);

    return readTree(this.inputTree).then(function(inDir){
      symlinkOrCopy.sync(path.join(inDir, self.inFile), path.join(self._inputStaging, self.inFile));
      return self.updateCache(self._destDir);
    }).then(function(){
      return self.watchNodeModules(readTree).then(function(){
        return self._destDir;
      });
    });
  },

  bundler: function() {
    if (!this._bundler) {
      this._bundler = this.makeBundler();
    }
    return this._bundler;
  },

  makeBundler: function() {
    var self = this;
    this.cache = {};
    var opts = merge({
      cache: this.cache,
      packageCache: {},
      fullPaths: true,
      basedir: this._inputStaging,
      outputFile: './browserify/browserify.js',
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
    b.add('./browserify_stubs.js');

    b.on('package', function(pkg){
      self._watchModules[pkg.__dirname] = true;
    });

    b.on('dep', function (dep) {
      if (typeof dep.id === 'string') {
        //self.cache[dep.id] = dep;
      }
    });
    return b;
  },

  updateCache: function(destDir) {
    var self = this;
    fs.mkdirSync(destDir + '/browserify');
    return new RSVP.Promise(function (resolve, reject) {
      self.bundler().bundle(function (err, data) {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(path.join(destDir, 'browserify', 'browserify.js'), data);
          resolve(destDir);
        }
      });
    });
  },

  watchNodeModules: function(readTree) {
    var self = this;
    return mapSeries(Object.keys(self._watchModules), function(dir){
      if (dir !== self.root){
        return readTree(dir);
      }
    });
  }
});
