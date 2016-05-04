/* global describe, afterEach, it, expect, beforeEach */

var chai = require('chai');
var expect = chai.expect;  // jshint ignore:line
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var StubGenerator = require('../lib/stub-generator');
var CachingBrowserify = require('../lib/caching-browserify');
var RSVP = require('rsvp');
RSVP.on('error', function(err){throw err;});
var fs = require('fs');
var path = require('path');
var broccoli = require('broccoli');
var quickTemp = require('quick-temp');
var copy = require('copy-dereference').sync;

var FIRST = {
  keys: [
    'npm:broccoli',
    'npm:x',
    'npm:y',
  ]
};

var SECOND = {
  keys: [
    'npm:broccoli',
    'npm:x',
    'npm:y',
    'npm:something-new',
  ]
};

var THIRD = {
  keys:  [
    'npm:x',
    'npm:y',
  ]
};

var FOURTH = {
  keys: [
    'npm:additional-thing',
    'npm:broccoli',
    'npm:x',
    'npm:y',
  ]
};

var FIFTH = {
  keys: [
    'npm:broccoli',
    'npm:y',
  ]
};

function Loader() {
  this.entries = {};
  this.setGlobalDefine();
}

Loader.prototype.load = function(path) {
  require(path);
};

Loader.prototype.unload = function(_path) {
  var path = fs.realpathSync(_path);
  delete require('module')._cache[path];
  delete require.cache[path];
  delete require('module')._cache[_path];
  delete require.cache[_path];
  this.entries = {};
};

Loader.prototype.reload = function(path) {
  this.unload(path);
  this.load(path);
};

Loader.prototype.require = function(name) {
  if (!(name in this.entries)) {
    throw new TypeError('no such module: `' + name + '`');
  }

  return this.entries[name]();
};

Loader.prototype.setGlobalDefine = function() {
  global.define = function(name, callback) {
    this.entries[name] = callback;
  }.bind(this);
};

Loader.prototype.teardown = function() {
  this.entries = undefined;
  delete global.define;
};

describe('Ember CLI 2.x Stub Generator', function() {
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
    it('only supports 1 inputTree', function() {
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
    var tree = new StubGenerator(src.inputTree);

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIRST.keys);

      var broc = loader.require('npm:broccoli');

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
    var tree = new StubGenerator(src.inputTree);

    builder = new broccoli.Builder(tree);

    var firstRun;
    return builder.build().then(function(result) {
      firstRun = fs.statSync(result.directory + '/browserify_stubs.js');
      return builder.build();
    }).then(function(result) {
      nextRun = fs.statSync(result.directory + '/browserify_stubs.js');

      expect(firstRun, 'stat information should remain the same').to.deep.equal(nextRun);
    });
  });

  it('adds deps from new file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIRST.keys);

      var broc = loader.require('npm:broccoli');

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

      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(SECOND.keys);
    });
  });

  it('removes deps from deleted file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIRST.keys);
      fs.unlinkSync(src.inputTree + '/sample.js');
      return builder.build();
    }).then(function(result){

      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(THIRD.keys);
    });
  });

  it('adds deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIRST.keys);

      var was = "define('foo', ['exports', 'npm:broccoli', 'npm:additional-thing'], function(exports, Broccoli, Additional) { exports['default'] = Broccoli;});";

      fs.writeFileSync(src.inputTree + '/sample.js', was);
      return builder.build();
    }).then(function(result){

      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FOURTH.keys);
    });
  });

  it('removes deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIRST.keys);

      var was = "define('foo', ['exports', 'npm:y'], function(exports, _npmY) {});";

      fs.writeFileSync(src.inputTree + '/inner/other.js', was);
      return builder.build();
    }).then(function(result){
      loader.reload(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIFTH.keys);
    });
  });
});

describe('Ember CLI 1.x Stub Generator', function() {
  var src = {};
  var builder;

  var loader;

  beforeEach(function() {
    loader = new Loader();
    quickTemp.makeOrRemake(src, 'tmp');
    src.inputTree = src.tmp + '/inputTree';
    copy(__dirname + '/fixtures/stubs/es6', src.inputTree);
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

  it('generates stub file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');

      expect(loader.entries).to.have.keys(FIRST.keys);
    });
  });

  it('adds deps from new file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys(FIRST.keys);
      fs.writeFileSync(src.inputTree + '/new.js', "import SomethingNew from \"npm:something-new\"\n");
      return builder.build();
    }).then(function(result){
      loader.reload(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys([
        'npm:broccoli',
        'npm:x',
        'npm:y',
        'npm:something-new'
      ]);
    });
  });

  it('removes deps from deleted file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys(FIRST.keys);
      fs.unlinkSync(src.inputTree + '/sample.js');
      return builder.build();
    }).then(function(result){
      loader.reload(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys([
        'npm:x',
        'npm:y'
      ]);
    });
  });

  it('adds deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys(FIRST.keys);
      var was = fs.readFileSync(src.inputTree + '/sample.js');
      was += "\nimport Additional from 'npm:additional-thing';";
      fs.writeFileSync(src.inputTree + '/sample.js', was);
      return builder.build();
    }).then(function(result){
      loader.reload(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys(FOURTH.keys);
    });
  });

  it('removes deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      loader.load(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys(FIRST.keys);
      var was = fs.readFileSync(src.inputTree + '/inner/other.js', 'utf-8');
      was = was.split("\n").slice(1).join("\n");

      fs.writeFileSync(src.inputTree + '/inner/other.js', was);
      return builder.build();
    }).then(function(result){
      loader.reload(result.directory + '/browserify_stubs.js');
      expect(loader.entries).to.have.keys(FIFTH.keys);
    });
  });
});


describe('CachingBrowserify', function() {
  var src = {};
  var builder;
  var readTrees;
  var loader;

  beforeEach(function() {
    loader = new Loader();

    quickTemp.makeOrRemake(src, 'tmp');
    src.inputTree = src.tmp + '/inputTree';
    copy(__dirname + '/fixtures/modules', src.inputTree);
    src.entryTree = src.inputTree + '/src';
    readTrees = {};
    fs.readdirSync(src.inputTree + '/node_modules').forEach(function(module){
      var parentLink = path.resolve(__dirname + '/../node_modules/' + module);
      var childLink = src.inputTree + '/node_modules/' + module;
      try {
        fs.lstatSync(parentLink);
        fs.unlinkSync(parentLink);
      } catch(err) {}
      fs.symlinkSync(childLink, parentLink);
    });

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

  function recordReadTrees(tree) {
    readTrees[tree] = true;
  }

  it('builds successfully', function() {
    var tree = new CachingBrowserify(src.entryTree);
    var spy = sinon.spy(tree, 'updateCache');
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result){
      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);
      expect(spy).to.have.callCount(1);
      return builder.build();
    }).then(function(){
      expect(spy).to.have.callCount(1);
    });
  });

  it('builds successfully with non-default output path', function() {
    var tree = new CachingBrowserify(src.entryTree, { outputFile: './special-browserify/browserify.js'});
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result){
      loader.load(result.directory + '/special-browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);
      return builder.build();
    });
  });

  it('builds successfully with sourcemaps on', function() {
    var tree = new CachingBrowserify(src.entryTree, {enableSourcemap: true});
    var spy = sinon.spy(tree, 'updateCache');
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result){
      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);

      var file = fs.readFileSync(result.directory + '/browserify/browserify.js', 'UTF8');
      expect(file).to.match(/sourceMappingURL=data:application\/json;.*base64,/);
      expect(spy).to.have.callCount(1);
      return builder.build();
    }).then(function(){
      expect(spy).to.have.callCount(1);
    });
  });

  it('rebuilds when an npm module changes', function(){
    var tree = new CachingBrowserify(src.entryTree);
    var spy = sinon.spy(tree, 'updateCache');

    builder = new broccoli.Builder(tree);
    return builder.build(recordReadTrees).then(function(result){
      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);

      expect(spy).to.have.callCount(1);

      expect(loader.require('npm:my-module').default.toString()).to.contain('other.something();');

      var module = path.resolve(__dirname + '/../node_modules/my-module');
      var target = module + '/index.js';

      expect(Object.keys(readTrees).filter(function(readTree) {
          return /my-module/.test(readTree);
      }), 'expected readTrees to contain a path that matched `/node_modules\/my-module/`').to.not.be.empty;

      var code = fs.readFileSync(target, 'utf-8');
      code = code.replace('other.something()', 'other.something()+1');
      fs.writeFileSync(target, code);

      return builder.build();
    }).then(function(result){
      expect(spy).to.have.callCount(2);

      loader.reload(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);

      expect(loader.require('npm:my-module').default.toString()).to.contain('other.something()+1;');
    });
  });

  it('rebuilds when the entry file changes', function(){
    var tree = new CachingBrowserify(src.entryTree);
    var spy = sinon.spy(tree, 'updateCache');

    builder = new broccoli.Builder(tree);
    return builder.build(recordReadTrees).then(function(result){
      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);

      expect(spy).to.have.callCount(1);
      expect(readTrees[src.entryTree]).to.equal(true, 'should be watching stubs file');
      fs.unlinkSync(src.entryTree + '/browserify_stubs.js');
      copy(src.entryTree + '/second_stubs.js', src.entryTree + '/browserify_stubs.js');
      return builder.build();
    }).then(function(result){
      expect(spy).to.have.callCount(2);

      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys([
        'npm:my-module'
      ]);
    });
  });

  it('recovers from failed build', function(){
    var broken = src.entryTree + '/broken_stubs.js';
    var normal = src.entryTree + '/browserify_stubs.js';
    var temporary = src.entryTree + '/temporary.js';

    copy(normal, temporary);
    fs.unlinkSync(normal);
    copy(broken, normal);

    var tree = new CachingBrowserify(src.entryTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(){
      throw new Error('expected not to get here');
    }, function(err){
      expect(err.message).to.match(/Cannot find module 'this-is-nonexistent'/);
      fs.unlinkSync(normal);
      copy(temporary, normal);
      return builder.build();
    }).then(function(result){
      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);
    });
  });
});
