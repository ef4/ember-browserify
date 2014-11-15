var StubGenerator = require('./stub-generator');
var CachingBrowserify = require('./caching-browserify');
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
    if (type !== 'js'){ return tree; }

    return mergeTrees([
      tree,
      new CachingBrowserify(new StubGenerator(tree))
    ]);
  }
};
