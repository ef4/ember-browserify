'use strict';

// Support old versions of Ember CLI.
// Nearest thing which provides `.import``
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

// The root host.
function findRoot(current) {
  var app;

  // Keep iterating upward until we don't have a grandparent.
  // Has to do this grandparent check because at some point we hit the project.
  // Stop at lazy engine boundaries.
  do {
    app = current.app || app;
  } while (current.parent && current.parent.parent && (current = current.parent));

  return app;
}

// The thing which browserify should run on.
function findTarget(current) {
  // If we are the project, or the project's child.
  if (!current.parent || !current.parent.parent) {
    return current.app;
  } else {
    return current.parent;
  }
}

var Funnel = require('broccoli-funnel');

function getPreprocessor(instance) {
  return {
    name: 'ember-browserify',
    ext: 'js',
    toTree: function(tree) { console.log('thingamabob'); return tree; }
  };
}

module.exports = {
  name: 'ember-browserify',

  included: function() {
    var host = findHost(this);
    var root = findRoot(this);
    var target = findTarget(this);
    var project = root.project;

    target.registry.add('js', getPreprocessor(this), ['js']);

    var VersionChecker = require('ember-cli-version-checker');

    var checker = new VersionChecker(this);
    var emberCliVersion = checker.for('ember-cli', 'npm');

    if (emberCliVersion.satisfies('< 2.0.0')) {
      throw new TypeError('ember-browserify@^2.0.0 no longer supports ember-cli versions less then 2.0.0.');
    }

    var enableSourcemaps = root.options.sourcemaps && root.options.sourcemaps.enabled && root.options.sourcemaps.extensions.indexOf('js') > -1;

    this.options = {
      root: project.root,
      browserifyOptions: project.config(root.env).browserify || {},
      enableSourcemap: enableSourcemaps,
      fullPaths: root.env !== 'production'
    };

    host.import('browserify/browserify.js');
    if (host.tests && (process.env.BROWSERIFY_TESTS || this.options.browserifyOptions.tests)) {
      host.import('browserify-tests/browserify.js', {
        type: 'test'
      });
    }

    if (host.importWhitelistFilters) {
      host.importWhitelistFilters.push(function(moduleName) {
        return moduleName.slice(0,4) === 'npm:';
      });
    }
  },

  postprocessTree: function(type, tree) {
    var root = findRoot(this);

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
      options.basedir = root.root;

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
