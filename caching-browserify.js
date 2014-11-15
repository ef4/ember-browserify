var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var RSVP = require('rsvp');
var CachingWriter = require('broccoli-caching-writer');

module.exports = CachingWriter.extend({
  enforceSingleInputTree: true,

  init: function(inputTree) {
    this.inputTree = inputTree;
  },

  updateCache: function(srcDir, destDir) {
    console.log("RUNNING BROWSERIFY");
    fs.mkdirSync(destDir + '/browserify');
    var b = browserify({
      basedir: srcDir,
      outputFile: './browserify/browserify.js'
    });
    b.add('./browserify_stubs.js');

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
  }
});
