// Support old versions of Ember CLI.
function findHost() {
  var current = this;
  var app;

  // Keep iterating upward until we don't have a grandparent.
  // Has to do this grandparent check because at some point we hit the project.
  // Stop at lazy engine boundaries.
  do {
    if (current.lazyLoading === true) { return current; }
    app = current.app || app;
  } while (current.parent && current.parent.parent && (current = current.parent));

  return app;
}

module.exports = {
  name: 'ember-browserify',

  included: function(app){
    var VersionChecker = require('ember-cli-version-checker');

    var checker = new VersionChecker(this);
    var emberCliVersion = checker.for('ember-cli', 'npm');

    if (emberCliVersion.satisfies('< 2.0.0')) {
      throw new TypeError('ember-browserify@^2.0.0 no longer supports ember-cli versions less then 2.0.0.');
    }

    app = findHost.call(this);

    var enableSourcemaps = app.options.sourcemaps && app.options.sourcemaps.enabled && app.options.sourcemaps.extensions.indexOf('js') > -1;

    this.app = app;

    this.options = {
      root: this.app.project.root,
      browserifyOptions: app.project.config(app.env).browserify || {},
      enableSourcemap: enableSourcemaps,
      fullPaths: app.env !== 'production'
    };

    app.import('browserify/browserify.js');
    if (app.tests && (process.env.BROWSERIFY_TESTS || this.options.browserifyOptions.tests)) {
      app.import('browserify-tests/browserify.js', {
        type: 'test'
      });
    }

    if (app.importWhitelistFilters) {
      app.importWhitelistFilters.push(function(moduleName){
        return moduleName.slice(0,4) === 'npm:';
      });
    }
  },

  postprocessTree: function(type, tree){
    var outputFile, options;
    if (type === 'js'){
      outputFile = 'browserify/browserify.js';
    } else if (type === 'test'){
      outputFile = 'browserify-tests/browserify.js';
    }

    if (outputFile) {
      var StubGenerator = require('./stub-generator');
      var CachingBrowserify = require('./caching-browserify');
      var MergeTrees = require('broccoli-merge-trees');

      options = Object.create(this.options);
      options.outputFile = outputFile;
      tree = new MergeTrees([
        tree,
        new CachingBrowserify(new StubGenerator(tree), options)
      ], { overwrite: true });
    }
    return tree;
  }
};
