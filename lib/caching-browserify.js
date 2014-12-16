var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var helpers = require('broccoli-kitchen-sink-helpers');
var RSVP = require('rsvp');
var CachingWriter = require('broccoli-caching-writer');
var mapSeries = require('promise-map-series');
var merge    = require('lodash-node/modern/objects/merge');

module.exports = CachingWriter.extend({
  init: function(){
    this.watchedNodeModules = Object.create(null);
  },

  read: function (readTree) {
    var self = this;
    self.watchPackages = [];
    return this._super.read.call(this, readTree).then(function(output){
      return self.watchNodeModules(readTree).then(function(){
        return output;
      });
    });
  },

  updateCache: function(srcDirs, destDir) {
    var self = this;
    fs.mkdirSync(destDir + '/browserify');
    var opts = merge({
      basedir: srcDirs[0],
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
    b.on('package', function(pkg){ self.watchPackages.push(pkg); });

    return new RSVP.Promise(function (resolve, reject) {
      b.bundle(function (err, data) {
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
    return mapSeries(self.watchPackages, function(pkg){
      var dir = pkg.__dirname;
      if (dir !== self.root && !self.watchedNodeModules[dir]){
        self.watchedNodeModules[dir] = true;
        self.inputTrees.push(dir);
        return readTree(dir).then(function(treeSrc){
          self._inputTreeCacheHash.push(helpers.hashStrings(self.keysForTree(treeSrc)));
        });
      }
    });
  }
});
