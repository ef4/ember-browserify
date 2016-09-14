var walkSync = require('walk-sync');
var path = require('path');

require('mocha-jshint')({
  paths: ['lib'].concat(walkSync(__dirname, { ignore: ['fixtures', '.gitignore'] }).
    map(function(relativePath) {
      return path.join(__dirname, relativePath);
    }))
});
