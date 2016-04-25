var acorn = require('acorn');
var fs = require('fs');
var helpers = require('broccoli-kitchen-sink-helpers');
var CachingWriter = require('broccoli-caching-writer');
var _ = require('lodash');
var md5Hex = require('md5-hex');
var debug = require('debug')('ember-browserify:stub-generator:');

module.exports = StubGenerator;
function StubGenerator(inputNodes) {
  if (!_.isArray(inputNodes)) {
    inputNodes = [inputNodes];
  }
  var options = {
    cacheInclude: [new RegExp('(.)+.js$')],
    persistentOutput: true
  };

  this.enforceSingleInputTree = true;

  // The importsCache lets us avoid re-parsing individual files that
  // haven't changed.
  this.importsCache = {};

  // The stubsCache lets us avoid re-running browserify when the set
  // of included modules hasn't changed.
  this.stubsCache = null;
  this._lastChecksum = null;

  CachingWriter.call(this, inputNodes, options);
  this.options = options;
}

StubGenerator.prototype = Object.create(CachingWriter.prototype);
StubGenerator.prototype.constructor = StubGenerator;
StubGenerator.prototype.build = function() {
  var stubs = {};

  var srcDir = this.inputPaths[0]; // above we enforceSingleInputTree already
  var files = this.listFiles();

  debug('files to gather from: %s (%d)', srcDir, files.length);

  var startGatherStubs = Date.now();

  files.forEach(function (fullPath) {
    if (fullPath.slice(-3) === '.js') {
      var relativePath = fullPath.replace(srcDir, '').
        replace(/^\//,''); // remove leading '/'

      gatherStubs(fullPath, relativePath, stubs, this.importsCache);
    }
  }.bind(this));

  var gatherStubsTime = Date.now() - startGatherStubs;
  var generateStart = Date.now();

  this.stubsCache = stubs;

  var content = generate(this.stubsCache);
  var newChecksum = md5Hex(content);

  var generateTime = Date.now() - generateStart;

  debug('times, gather %dms, generate: %dms', gatherStubsTime, generateTime);
  if (newChecksum !== this._lastChecksum) {
    debug('MISS %s !== %s', newChecksum, this._lastChecksum);
    this._lastChecksum = newChecksum;
    fs.writeFileSync(this.outputPath + '/browserify_stubs.js', content);
  } else {
    debug('HIT %s === %s', newChecksum, this._lastChecksum);
  }
};


function gatherStubs(fullPath, relativePath, stubs, cache) {
  var src = fs.readFileSync(fullPath);
  var key = helpers.hashStrings([
    relativePath,
    src
  ]);

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
