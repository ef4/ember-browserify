var StubGenerator = require('./stub-generator');
var browserify = require('broccoli-browserify');
var mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-browserify',

  included: function(app){
    app.import('browserify/browserify.js');
    app.importWhitelistFilters.push(function(moduleName){
      return moduleName.slice(0,4) === 'npm:';
    });
  },

  postprocessTree: function(type, tree){
    if (type === 'js'){
      var bundle = browserify(StubGenerator(tree), {
        entries: ['./browserify_stubs.js'],
        outputFile: './browserify/browserify.js'
      });
      return mergeTrees([tree, bundle]);
    } else
      return tree;
  }
};
