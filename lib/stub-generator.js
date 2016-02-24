var walkSync = require('walk-sync');
var acorn = require('acorn');
var fs = require('fs');
var helpers = require('broccoli-kitchen-sink-helpers');
var CachingWriter = require('broccoli-caching-writer');
var path = require('path');
var _ = require('lodash');

module.exports = StubGenerator;
function StubGenerator(inputNodes) {
  if (!_.isArray(inputNodes)) {
    inputNodes = [inputNodes];
  }
  var options = {
    cacheInclude: [new RegExp('(.)+.js$')]
  };

  this.enforceSingleInputTree = true;

  // The importsCache lets us avoid re-parsing individual files that
  // haven't changed.
  this.importsCache = {};

  // The stubsCache lets us avoid re-running browserify when the set
  // of included modules hasn't changed.
  this.stubsCache = null;

  CachingWriter.call(this, inputNodes, options);
  this.options = options;
}

StubGenerator.prototype = Object.create(CachingWriter.prototype);
StubGenerator.prototype.constructor = StubGenerator;
StubGenerator.prototype.build = function() {
  var stubs = {};
  this.inputPaths.forEach(function(srcDir) {
    var paths = walkSync(srcDir);
    paths.forEach(function (relativePath) {
      if (relativePath.slice(-3) === '.js') {
        gatherStubs(srcDir, relativePath, stubs, this.importsCache);
      }
    }.bind(this));
  }.bind(this));

  this.stubsCache = stubs;
  fs.writeFileSync(path.join(this.outputPath, 'browserify_stubs.js'), generate(this.stubsCache));
};


function gatherStubs(srcDir, relativePath, stubs, cache) {
  var src = fs.readFileSync(path.join(srcDir, relativePath));
  var key = helpers.hashStrings([relativePath, src]);

  if (cache[key]) {
    var len = cache[key].length;
    for (var i=0; i<len; i++) {
      stubs[cache[key][i]] = true;
    }
    return;
  }

  var cacheEntry = cache[key] = [];
  var imports = parseImports(src);
  Object.keys(imports).forEach(function(moduleName){
    stubs[moduleName] = true;
    cacheEntry.push(moduleName);
  });
}

function generate(stubs) {
  return Object.keys(stubs).map(function(moduleName){
    return "define('npm:" +
      moduleName +
      "', function(){ return { 'default': require('" +
      moduleName +
      "')};})";
  }).join("\n");
}

function forEachNode(node, visit) {
  if (node && typeof node === 'object' && !node._eb_visited) {
    node._eb_visited = true;
    visit(node);
    var keys = Object.keys(node);
    for (var i=0; i < keys.length; i++) {
      forEachNode(node[keys[i]], visit);
    }
  }
}

function parseEs5(src) {
  var imports = {};

  var ast = acorn.parse(src);

  forEachNode(ast, function(entry) {
    if (entry.type === 'CallExpression' && entry.callee.name === 'define') {
      head(entry.arguments.filter(function(item) {
        return item.type === 'ArrayExpression';
      })).elements.filter(function(element) {
        return element.value.slice(0, 4) === 'npm:';
      }).forEach(function(element) {
        imports[element.value.slice(4)] = true;
      });
    }
  });
  return imports;
}

function parseEs6(src) {
  var imports = {};

  var ast = acorn.parse(src, {
    ecmaVersion: 6,
    sourceType: 'module'
  });

  forEachNode(ast, function(entry) {
    if (entry.type === 'ImportDeclaration') {
      var source = entry.source.value;
      if (source.slice(0,4) === 'npm:') {
        if (entry.kind === 'named') {
          throw new Error("ember-browserify doesn't support named imports (you tried to import " + entry.specifiers[0].id.name +  " from " + source);
        }
        imports[source.slice(4)] = true;
      }
    }
  });

  return imports;
}

function tryCatch(func, arg) {
  try {
    return func.call(null, arg);
  }
  catch(e) {
    return e;
  }
}

function parseImports(src) {
  // In ember cli 2.x, src is es5 code, whereas in ember cli 1.x, src is still es6 code.

  // First, try to parse as es5 code. Es6 code will return an error.
  var result = tryCatch(parseEs5, src);
  // If a syntax error is thrown, we assume this is because src is es6 code.
  if (result instanceof Error) {
    result = tryCatch(parseEs6, src);
  }

  // If result is still an error, there must have been a parse error
  if (result instanceof Error) {
    throw new Error('Error parsing code while looking for "npm:" imports: ' + result.stack || result);
  }

  return result;
}

function head(array) {
  return array[0];
}
