'use strict';

// Support old versions of Ember CLI.
function findHost(current) {
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

var Funnel = require('broccoli-funnel');

module.exports = {
  name: 'ember-browserify',

  included: function(app) {
    var VersionChecker = require('ember-cli-version-checker');

    var checker = new VersionChecker(this);
    var emberCliVersion = checker.for('ember-cli', 'npm');

    if (emberCliVersion.satisfies('< 2.0.0')) {
      throw new TypeError('ember-browserify@^2.0.0 no longer supports ember-cli versions less then 2.0.0.');
    }
    this.that = app;

    app = findHost(this);

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
      app.importWhitelistFilters.push(function(moduleName) {
        return moduleName.slice(0,4) === 'npm:';
      });
    }
  },

  postprocessTree: function(type, tree) {
    console.log('OMG', type, this.name, this.app.name, this.that.name);
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
      options.basedir = this.app.root;

      // produces:
      //   - browserify_stubs.js (for CachingBrowserify, to build a bundle);
      //   - any inputFiles that had npm imports
      var stubs = new StubGenerator(tree, options);

      tree = new MergeTrees([
        // original files
        tree,

        // copies rewritten inputFiles over (overwriting original files)
        new Funnel(stubs, { exclude: ['browserify_stubs.js'] }),

        // produces browserify bundle, named options.outputFile (defaulting to browserify/browserify.js)
        new CachingBrowserify(stubs, options)
      ], { overwrite: true });
    }

    return tree;
  }
};
