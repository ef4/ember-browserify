var expect = require('chai').expect;
var importsFor = require('../lib/imports-for');

describe('importsFor', function() {
  it('parses ES6', function() {
    expect(importsFor('import asdf from "npm:asdf"')).to.eql({ asdf: true });
    expect(importsFor('import asdf from "npm:asdf"')).to.eql({ asdf: true });
    expect(importsFor('import asdf from "npm:asdf"')).to.eql({ asdf: true });
    expect(importsFor('import apple from "npm:foo"')).to.eql({ foo:  true });
  })

  it('parses AMD (ES5)', function() {
    expect(importsFor('define("asdf", ["npm:asdf"], function() { });')).to.eql({ asdf: true });
    expect(importsFor('define("asdf", ["npm:asdf"], function() { });')).to.eql({ asdf: true });
    expect(importsFor('define("asdf", ["npm:asdf"], function() { });')).to.eql({ asdf: true });
    expect(importsFor('define("apple", ["npm:foo"], function() { });')).to.eql({ foo:  true});
  });
});
