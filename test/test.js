/* global describe, afterEach, it, expect, beforeEach */

var chai = require('chai');
var expect = chai.expect;  // jshint ignore:line
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Loader = require('./helpers/loader');
chai.use(sinonChai);

var CachingBrowserify = require('../lib/caching-browserify');
var fs = require('fs');
var path = require('path');
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
        fs.symlinkSync(childLink, parentLink);
      } catch(err) {}
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
    var module = src.inputTree + '/node_modules/my-module';
    var target = module + '/index.js';

    var tree = new CachingBrowserify(src.entryTree);
    var spy = sinon.spy(tree, 'updateCache');

    builder = new broccoli.Builder(tree);
    return builder.build(recordReadTrees).then(function(result){
      loader.load(result.directory + '/browserify/browserify.js');
      expect(loader.entries).to.have.keys(['npm:my-module']);

      expect(spy).to.have.callCount(1);

      expect(loader.require('npm:my-module').default.toString()).to.contain('other.something();');

      expect(Object.keys(readTrees).filter(function(readTree) {
          return /my-module/.test(readTree);
      }), 'expected readTrees to contain a path that matched `/node_modules\/my-module/`').to.not.be.empty;

      var code = fs.readFileSync(target, 'utf-8');
      code = code.replace('other.something()', 'other.something()+1');
      fs.unlinkSync(target);
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
