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
        stubs.set('foo/bar', { asdf: { version: '1.0.0' }});
      });

      it('toAMD', function() {
        expect(stubs.toAMD()).to.eql("define('npm:asdf@1.0.0', function(){ return { 'default': require('asdf')};})");
      });

      it('delete', function() {
        stubs.delete('foo/bar');
        expect(stubs.toAMD()).to.eql("");
      });

      it('set', function() {
        stubs.set('foo', { asdf: { version: '42' }});
        expect(stubs.toAMD()).to.eql("define('npm:asdf@42', function(){ return { 'default': require('asdf')};})");
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
          stubs.set('foo', { asdf: { version: 1 }});
          expect(stubs.toAMD()).to.eql("define('npm:asdf@1', function(){ return { 'default': require('asdf')};})");
        });

        it('set', function() {
          stubs.set('apple', { asdf: { version: 'OMG' }, foo: { version: '22' }});
          expect(stubs.toAMD()).to.eql("define('npm:asdf@OMG', function(){ return { 'default': require('asdf')};})\ndefine('npm:foo@22', function(){ return { 'default': require('foo')};})");
        });
      });
    });

    describe('es5', function() {
      beforeEach(function() {
        stubs.set('foo/bar', { asdf: { version: '3.0.0' }});
      });

      it('toAMD', function() {
        expect(stubs.toAMD()).to.eql("define('npm:asdf@3.0.0', function(){ return { 'default': require('asdf')};})");
      });

      it('delete', function() {
        stubs.delete('foo/bar');
        expect(stubs.toAMD()).to.eql("");
      });

      it('set', function() {
        stubs.set('foo', { asdf: { version: '3.0.0' }});
        expect(stubs.toAMD()).to.eql("define('npm:asdf@3.0.0', function(){ return { 'default': require('asdf')};})");
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
          stubs.set('foo', { asdf: { version: '1'}});
          expect(stubs.toAMD()).to.eql("define('npm:asdf@1', function(){ return { 'default': require('asdf')};})");
        });

        it('set', function() {
          stubs.set('apple', { foo: { version: 16 }});
          expect(stubs.toAMD()).to.eql("define('npm:asdf@3.0.0', function(){ return { 'default': require('asdf')};})\ndefine('npm:foo@16', function(){ return { 'default': require('foo')};})");
        });
      });
    });
  });
});
