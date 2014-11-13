var StubGenerator = require('./stub-generator');
var browserify = require('broccoli-browserify');

// 'modules' is an output -- it will gather up the list of modules
// that we packaged, so you can whitelist them during es6-compilation.
module.exports = function emberBrowserify(tree, modules){
  return browserify(StubGenerator(tree, modules), {
      entries: ['./browserify_stubs.js']
  });
};
