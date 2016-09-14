/* global describe, afterEach, it, beforeEach */

var chai = require('chai');
var expect = chai.expect;  // jshint ignore:line
var Loader = require('./helpers/loader');

var StubGenerator = require('../lib/stub-generator');

var fs = require('fs');
var broccoli = require('broccoli');
var quickTemp = require('quick-temp');
var copy = require('copy-dereference').sync;
var walkSync = require('walk-sync');

var keys = require('./helpers/keys');

var FIRST = keys.FIRST;
var SECOND = keys.SECOND;
var THIRD = keys.THIRD;
var FOURTH = keys.FOURTH;
var FIFTH = keys.FIFTH;

describe('Stub Generator', function() {
  var src = {};
  var builder;
  var loader;

  beforeEach(function() {
    loader = new Loader();

    quickTemp.makeOrRemake(src, 'tmp');
    src.inputTree = src.tmp + '/inputTree';
    copy(__dirname + '/fixtures/stubs/es5', src.inputTree);
  });

  afterEach(function() {
    loader.teardown();

    if (src.tmp) {
      quickTemp.remove(src, 'tmp');
    }

    if (builder) {
      return builder.cleanup();
    }
  });

  describe('input', function() {
    it('supports 1 inputTree', function() {
      expect(function() {
        new StubGenerator();
      }).to.throw(/Expects one inputTree/);
      expect(function() {
        new StubGenerator([]);
      }).to.throw(/Expects one inputTree/);
      expect(function() {
        new StubGenerator(['a','b']);
      }).to.throw(/Expects one inputTree/);
    });
  });

  it('generates stub file', function() {
    var tree = new StubGenerator(src.inputTree, {
      basedir: __dirname + '/fixtures/modules'
    });

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      loader.load(result.directory + '/sample.js');
      loader.load(result.directory + '/inner/other.js');

      expect(loader.entries).to.have.keys(FIRST.keys);

      var broc = loader.require('npm:broccoli@3.0.0');

      expect(broc).to.have.keys(['default']);
      expect(broc.default).to.have.keys([
        'loadBrocfile',
        'server',
        'getMiddleware',
        'Watcher',
        'cli',
        'makeTree',
        'bowerTrees',
        'MergedTree',
        'Builder'
      ]);
    });
  });

  it('generates same stubFile if inputs do not change', function() {
    var tree = new StubGenerator(src.inputTree, {
      basedir: __dirname + '/fixtures/modules'
    });

    builder = new broccoli.Builder(tree);

    var firstRun;
    return builder.build().then(function(result) {
      firstRun = fs.statSync(result.directory + '/browserify_stubs.js');
      return builder.build();
    }).then(function(result) {
      var nextRun = fs.statSync(result.directory + '/browserify_stubs.js');

      expect(firstRun, 'stat information should remain the same').to.deep.equal(nextRun);
    });
  });

  it('adds deps from new file', function() {
    var tree = new StubGenerator(src.inputTree, {
      basedir: __dirname + '/fixtures/modules'
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      loader.load(result.directory + '/sample.js');
      loader.load(result.directory + '/inner/other.js');

      expect(walkSync(result.directory)).to.eql([
        'browserify_stubs.js',
        'inner/',
        'inner/other.js',
        'sample.js',
      ]);

      expect(loader.entries).to.have.keys(FIRST.keys);

      var broc = loader.require('npm:broccoli@3.0.0');

      expect(broc).to.have.keys(['default']);
      expect(broc.default).to.have.keys([
        'loadBrocfile',
        'server',
        'getMiddleware',
        'Watcher',
        'cli',
        'makeTree',
        'bowerTrees',
        'MergedTree',
        'Builder'
      ]);

      fs.writeFileSync(src.inputTree + '/new.js', "define(\"fizz\", [\"exports\", \"npm:something-new\"], function(exports, SomethingNew) {});");
      return builder.build();
    }).then(function(result){
     expect(walkSync(result.directory)).to.eql([
        'browserify_stubs.js',
        'inner/',
        'inner/other.js',
        'new.js',
        'sample.js',
      ]);

      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(SECOND.keys);
    });
  });

  it('removes deps from deleted file', function() {
    var tree = new StubGenerator(src.inputTree, {
      basedir: __dirname + '/fixtures/modules'
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      loader.load(result.directory + '/sample.js');
      loader.load(result.directory + '/inner/other.js');

      expect(loader.entries).to.have.keys(FIRST.keys);
      fs.unlinkSync(src.inputTree + '/sample.js');
      return builder.build();
    }).then(function(result){

      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(THIRD.keys);
    });
  });

  it('adds deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree, {
      basedir: __dirname + '/fixtures/modules'
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      loader.load(result.directory + '/sample.js');
      loader.load(result.directory + '/inner/other.js');

      expect(walkSync(result.directory)).to.eql([
        'browserify_stubs.js',
        'inner/',
        'inner/other.js',
        'sample.js',
      ]);

      expect(loader.entries).to.have.keys(FIRST.keys);

      var was = "define('foo', ['exports', 'npm:broccoli', 'npm:additional-thing'], function(exports, Broccoli, Additional) { exports['default'] = Broccoli;});";

      fs.writeFileSync(src.inputTree + '/sample.js', was);
      return builder.build();
    }).then(function(result){

      expect(walkSync(result.directory)).to.eql([
        'browserify_stubs.js',
        'inner/',
        'inner/other.js',
        'sample.js',
      ]);

      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FOURTH.keys);
    });
  });

  it('removes deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree, {
      basedir: __dirname + '/fixtures/modules'
    });
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      loader.load(result.directory + '/sample.js');
      loader.load(result.directory + '/inner/other.js');

      expect(loader.entries).to.have.keys(FIRST.keys);

      expect(walkSync(result.directory)).to.eql([
        'browserify_stubs.js',
        'inner/',
        'inner/other.js',
        'sample.js',
      ]);

      var was = "define('foo', ['exports', 'npm:y'], function(exports, _npmY) {});";

      fs.writeFileSync(src.inputTree + '/inner/other.js', was);
      return builder.build();
    }).then(function(result){
      loader.reload(result.directory + '/browserify_stubs.js');

      expect(walkSync(result.directory)).to.eql([
        'browserify_stubs.js',
        'inner/',
        'inner/other.js',
        'sample.js',
      ]);

      expect(loader.entries).to.have.keys(FIFTH.keys);
    });
  });
});
