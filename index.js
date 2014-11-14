var StubGenerator = require('./stub-generator');
var browserify = require('broccoli-browserify');

module.exports = function emberBrowserify(tree){
  return browserify(StubGenerator(tree), {
      entries: ['./browserify_stubs.js']
  });
};
