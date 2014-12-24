var StubGenerator = require('./stub-generator');
var CachingBrowserify = require('./caching-browserify');
var mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-browserify',

  included: function(app){
    var enableSourcemaps = app.options.sourcemaps && app.options.sourcemaps.enabled && app.options.sourcemaps.extensions.indexOf('js') > -1;

    this.app = app;

    this.options = {
      root: this.app.project.root,
      browserifyOptions: app.project.config(app.env).browserify || {},
      enableSourcemap: enableSourcemaps,
      fullPaths: app.env !== 'production'
    };

    app.import('browserify/browserify.js');
    if (app.importWhitelistFilters) {
      app.importWhitelistFilters.push(function(moduleName){
        return moduleName.slice(0,4) === 'npm:';
      });
    }
  },

  postprocessTree: function(type, tree){
    if (type !== 'js'){ return tree; }
    return mergeTrees([
      tree,
      new CachingBrowserify(new StubGenerator(tree), this.options)
    ]);
  }
};
