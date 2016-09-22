#!/usr/bin/env node

var symlinkOrCopy = require('symlink-or-copy');
var path = require('path');
var rimraf = require('rimraf');
var fs = require('fs');

['modern', 'outdated'].forEach(function(inRepoAddon) {
  var source = path.resolve(__dirname, '..', 'lib/');
  var target = path.resolve(__dirname, '..', 'tests/dummy/lib', inRepoAddon, 'node_modules/ember-browserify/lib/');

  console.log('rimraf', target);
  rimraf.sync(target);

  console.log('symlink', source, target)
  symlinkOrCopy.sync(source, target);
});
