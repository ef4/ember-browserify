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
var _ = require('lodash');

describe('Ember CLI 2.x Stub Generator', function() {
  var src = {};
  var builder;

  beforeEach(function() {
    quickTemp.makeOrRemake(src, 'tmp');
    src.inputTree = src.tmp + '/inputTree';
    copy(__dirname + '/fixtures/stubs/es5', src.inputTree);
  });

  afterEach(function() {
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
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
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
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      fs.writeFileSync(src.inputTree + '/new.js', "define(\"fizz\", [\"exports\", \"npm:something-new\"], function(exports, SomethingNew) {});");
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('second.js').in(result);
    });
  });

  it('removes deps from deleted file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      fs.unlinkSync(src.inputTree +'/sample.js');
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('third.js').in(result);
    });
  });

  it('adds deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      var was = "define('foo', ['exports', 'npm:broccoli', 'npm:additional-thing'], function(exports, Broccoli, Additional) { exports['default'] = Broccoli;});";

      fs.writeFileSync(src.inputTree + '/sample.js', was);
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('fourth.js').in(result);
    });
  });

  it('removes deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      var was = "define('foo', ['exports', 'npm:y'], function(exports, _npmY) {});";

      fs.writeFileSync(src.inputTree + '/inner/other.js', was);
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('fifth.js').in(result);
    });
  });
});

describe('Ember CLI 1.x Stub Generator', function() {
  var src = {};
  var builder;

  beforeEach(function() {
    quickTemp.makeOrRemake(src, 'tmp');
    src.inputTree = src.tmp + '/inputTree';
    copy(__dirname + '/fixtures/stubs/es6', src.inputTree);
  });

  afterEach(function() {
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
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
    });
  });

  it('adds deps from new file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      fs.writeFileSync(src.inputTree + '/new.js', "import SomethingNew from \"npm:something-new\"\n");
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('second.js').in(result);
    });
  });

  it('removes deps from deleted file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      fs.unlinkSync(src.inputTree + '/sample.js');
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('third.js').in(result);
    });
  });

  it('adds deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      var was = fs.readFileSync(src.inputTree + '/sample.js');
      was += "\nimport Additional from 'npm:additional-thing';";
      fs.writeFileSync(src.inputTree + '/sample.js', was);
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('fourth.js').in(result);
    });
  });

  it('removes deps in modified file', function() {
    var tree = new StubGenerator(src.inputTree);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result) {
      expectFile('browserify_stubs.js').toMatch('first.js').in(result);
      var was = fs.readFileSync(src.inputTree + '/inner/other.js', 'utf-8');
      was = was.split("\n").slice(1).join("\n");

      fs.writeFileSync(src.inputTree + '/inner/other.js', was);
      return builder.build();
    }).then(function(result){
      expectFile('browserify_stubs.js').toMatch('fifth.js').in(result);
    });
  });
});


describe('CachingBrowserify', function() {
  var src = {};
  var builder;
  var readTrees;
  var defaultOptions;

  beforeEach(function() {
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
    defaultOptions = {
      fullPaths: false
    };


  });

  afterEach(function() {
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
    var tree = new CachingBrowserify(src.entryTree, defaultOptions);
    var spy = sinon.spy(tree, 'updateCache');
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result){
      expectFile('browserify/browserify.js').toMatch('bundle1.js').in(result);
      expect(spy).to.have.callCount(1);
      return builder.build();
    }).then(function(){
      expect(spy).to.have.callCount(1);
    });
  });

  it('builds successfully with non-default output path', function() {
    var tree = new CachingBrowserify(src.entryTree, _.merge({ 
      outputFile: './special-browserify/browserify.js'
    }, defaultOptions));
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result){
      expectFile('special-browserify/browserify.js').toMatch('bundle1.js').in(result);
      return builder.build();
    });
  });


  it('builds successfully with sourcemaps on', function() {
    var tree = new CachingBrowserify(src.entryTree, _.merge({
      enableSourcemap: true
    }, defaultOptions));
    var spy = sinon.spy(tree, 'updateCache');
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(result){
      expectFile('browserify/browserify.js').toMatch('bundle4.js').in(result);
      expect(spy).to.have.callCount(1);
      return builder.build();
    }).then(function(){
      expect(spy).to.have.callCount(1);
    });
  });


  it('rebuilds when an npm module changes', function(){
    var tree = new CachingBrowserify(src.entryTree, defaultOptions);
    var spy = sinon.spy(tree, 'updateCache');

    builder = new broccoli.Builder(tree);
    return builder.build(recordReadTrees).then(function(result){
      expectFile('browserify/browserify.js').toMatch('bundle1.js').in(result);
      expect(spy).to.have.callCount(1);
      var module = path.join(src.inputTree, 'node_modules', 'my-module');
      var target = path.join(module, 'index.js');
      expect(readTrees).to.contain.key(module);
      var code = fs.readFileSync(target, 'utf-8');
      code = code.replace('other.something()', 'other.something()+1');
      fs.writeFileSync(target, code);
      return builder.build();
    }).then(function(result){
      expect(spy).to.have.callCount(2);
      expectFile('browserify/browserify.js').toMatch('bundle2.js').in(result);
    });
  });

  it('rebuilds when the entry file changes', function(){
    var tree = new CachingBrowserify(src.entryTree, defaultOptions);
    var spy = sinon.spy(tree, 'updateCache');

    builder = new broccoli.Builder(tree);
    return builder.build(recordReadTrees).then(function(result){
      expectFile('browserify/browserify.js').toMatch('bundle1.js').in(result);
      expect(spy).to.have.callCount(1);
      expect(readTrees[src.entryTree]).to.equal(true, 'should be watching stubs file');
      fs.unlinkSync(src.entryTree + '/browserify_stubs.js');
      copy(src.entryTree + '/second_stubs.js', src.entryTree + '/browserify_stubs.js');
      return builder.build();
    }).then(function(result){
      expect(spy).to.have.callCount(2);
      expectFile('browserify/browserify.js').toMatch('bundle3.js').in(result);
    });
  });

  it('recovers from failed build', function(){
    var broken = src.entryTree + '/broken_stubs.js';
    var normal = src.entryTree + '/browserify_stubs.js';
    var temporary = src.entryTree + '/temporary.js';

    copy(normal, temporary);
    fs.unlinkSync(normal);
    copy(broken, normal);

    var tree = new CachingBrowserify(src.entryTree, defaultOptions);
    builder = new broccoli.Builder(tree);
    return builder.build().then(function(){
      throw new Error('expected not to get here');
    }, function(err){
      expect(err.message).to.match(/Cannot find module 'this-is-nonexistent'/);
      fs.unlinkSync(normal);
      copy(temporary, normal);
      return builder.build();
    }).then(function(result){
      expectFile('browserify/browserify.js').toMatch('bundle1.js').in(result);
    });
  });
});

function expectFile(filename) {
  var stripURL = false;
  var expectedFilename = filename;
  return {
      in: function(result) {
        var actualContent = fs.readFileSync(result.directory + '/' + filename, 'utf-8');

        // work around annoying browserify bug that prevent repeatable builds
        var pattern = new RegExp(path.resolve(__dirname + '/..'), 'g');
        actualContent = actualContent.replace(pattern, '');

        fs.writeFileSync(__dirname + '/actual/' + expectedFilename, actualContent);

        var expectedContent;
        var expectedPath = __dirname + '/expected/' + expectedFilename;

        try {
          expectedContent = fs.readFileSync(expectedPath, 'utf-8');
          if (stripURL) {
            expectedContent = expectedContent.replace(/\/\/# sourceMappingURL=.*$/, '');
          }

        } catch (err) {
          console.warn('Missing expcted file: ', expectedPath);
        }
        expectSameFiles(actualContent, expectedContent, expectedFilename);
        return this;
      },
    notIn: function(result) {
      expect(fs.existsSync(result.directory + '/' + filename)).to.equal(false, filename + ' should not have been present');
      return this;
    },
    toMatch: function(expectedName) {
      expectedFilename = expectedName;
      return this;
    },
    withoutSrcURL: function() {
      stripURL = true;
      return this;
    }
  };
}

function expectSameFiles(actualContent, expectedContent, filename) {

  if (/\.map$/.test(filename)) {
    expect(JSON.parse(actualContent)).to.deep.equal(JSON.parse(expectedContent), 'discrepancy in ' + filename);
  } else {
    expect(actualContent).to.equal(expectedContent, 'discrepancy in ' + filename);
  }
}
