/* global describe, it */

var expect = require('chai').expect;
var importsFor = require('../lib/imports-for');

describe('importsFor', function() {
  it('parses AMD (ES5)', function() {
    expect(importsFor('define("asdf", ["npm:asdf"], function() { });')).to.eql({ asdf: true });
    expect(importsFor('define("asdf", ["npm:asdf"], function() { });')).to.eql({ asdf: true });
    expect(importsFor('define("asdf", ["npm:asdf"], function() { });')).to.eql({ asdf: true });
    expect(importsFor('define("apple", ["npm:foo"], function() { });')).to.eql({ foo:  true});
  });
});
