/* global describe, it */

var expect = require('chai').expect;
var importsFor = require('../lib/imports-for');

function toPojo(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe('importsFor', function() {
  it('parses AMD (ES5)', function() {
    expect(toPojo(importsFor('define("apple", ["npm:foo"], function() { });'))).to.eql({ foo: { "end": { "column": 26, "line": 1 }, "start": { "column": 17, "line": 1 } } });
  });
});
