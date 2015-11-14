var StubGenerator = require('./stub-generator');
var CachingBrowserify = require('./caching-browserify');
var mergeTrees = require('broccoli-merge-trees');
var semver = require('semver');

module.exports = {
  name: 'ember-browserify',

  included: function(app){
    var project = app.project;
    var emberCliVersion = (project &&
      project.cli &&
      project.cli.analytics &&
      project.cli.analytics.version) || '1.13.8';

    var newImportApi = semver.gt(emberCliVersion, '1.13.8');

    // Stop-gap measure to support another addon
    // consuming this addon. https://github.com/ef4/ember-browserify/issues/29
    if (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

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
      if (newImportApi) {
        app.import('browserify-tests/browserify.js', {
          type: 'test'
        });
      } else {
        app.import({
          test: 'browserify-tests/browserify.js'
        });
      }
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
      options = Object.create(this.options);
      options.outputFile = outputFile;
      tree = mergeTrees([
        tree,
        new CachingBrowserify(new StubGenerator(tree), options)
      ]);
    }
    return tree;
  }
};
