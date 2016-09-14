'use strict';

var resolve = require('resolve');
var findUp = require('find-up');
var path = require('path');
var fs = require('fs');

module.exports = function versionForModuleName(name, basedir) {
  var cwd = path.dirname(resolve.sync(name, {
    basedir: basedir
  }));

  var content = fs.readFileSync(findUp.sync('package.json', {
    cwd:  cwd
  }), 'UTF8');

  return JSON.parse(content).version;
};
