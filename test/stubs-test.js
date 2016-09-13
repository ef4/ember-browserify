var Stubs = require('../lib/stubs');
var chai = require('chai');
var expect = chai.expect;  // jshint ignore:line
var importsFor = require('../lib/imports-for');

describe('Stubs', function() {
  var stubs;

  beforeEach(function() {
    stubs = new Stubs();
  });

  describe('no-data', function() {
    it('toAMD', function() {
      expect(stubs.toAMD()).to.eql('');
    })
  });

  describe('basic', function() {
    describe('es6', function() {
      beforeEach(function() {
        stubs.set('foo/bar', importsFor('import asdf from "npm:asdf"'));
      });

      it('toAMD', function() {
        expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})");
      });

      it('delete', function() {
        stubs.delete('foo/bar');
        expect(stubs.toAMD()).to.eql("");
      });

      it('set', function() {
        stubs.set('foo', importsFor('import asdf from "npm:asdf"'));
        expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})");
      });

      describe('cache busting', function() {
        beforeEach(function() {
          stubs.toAMD();
        });

        it('delete', function() {
          stubs.delete('foo/bar');
          expect(stubs.toAMD()).to.eql("");
        });

        it('delete then add back', function() {
          stubs.delete('foo/bar');
          expect(stubs.toAMD()).to.eql("");
          stubs.set('foo', importsFor('import asdf from "npm:asdf"'));
          expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})");
        });

        it('set', function() {
          stubs.set('apple', importsFor('import apple from "npm:foo"'));
          expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})\ndefine('npm:foo', function(){ return { 'default': require('foo')};})");
        });
      });
    });

    describe('es5', function() {
      beforeEach(function() {
        stubs.set('foo/bar', importsFor('define("asdf", ["npm:asdf"], function() { });'));
      });

      it('toAMD', function() {
        expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})");
      });

      it('delete', function() {
        stubs.delete('foo/bar');
        expect(stubs.toAMD()).to.eql("");
      });

      it('set', function() {
        stubs.set('foo', importsFor('define("asdf", ["npm:asdf"], function() { });'));
        expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})");
      });

      describe('cache busting', function() {
        beforeEach(function() {
          stubs.toAMD();
        });

        it('delete', function() {
          stubs.delete('foo/bar');
          expect(stubs.toAMD()).to.eql("");
        });

        it('delete then add back', function() {
          stubs.delete('foo/bar');
          expect(stubs.toAMD()).to.eql("");
          stubs.set('foo', importsFor('define("asdf", ["npm:asdf"], function() { });'));
          expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})");
        });

        it('set', function() {
          stubs.set('apple', importsFor('define("apple", ["npm:foo"], function() { });'));
          expect(stubs.toAMD()).to.eql("define('npm:asdf', function(){ return { 'default': require('asdf')};})\ndefine('npm:foo', function(){ return { 'default': require('foo')};})");
        });
      });
    });
  });
});
