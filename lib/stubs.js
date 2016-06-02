module.exports = Stub;
var acorn = require('acorn');
var debug = require('debug')('ember-browserify:stubs');

function Stub() {
  this._isDirty = true;
  this._map = {};
  this.resetStats();
}

Stub.prototype.resetStats = function() {
  this._stats = {
    deletions: 0,
    sets: 0,
    importTime: 0
  };
};

Stub.prototype.delete = function(fullPath) {
  this._stats.deletions++;

  if (fullPath in this._map) {
    delete this._map[fullPath];
    this._isDirty = true;
  }
};

Stub.prototype.set = function(fullPath, content) {
  this._isDirty = true;
  var start = Date.now();
  this._map[fullPath] = importsFor(content, fullPath);
  this._stats.importTime += (Date.now() - start);
};

Stub.prototype.toAMD = function() {
  debug("%o", this._stats);
  debug("isDirty", this._dirty);
  this.resetStats();

  if (this._isDirty === false) {
    return this._amd;
  }

  this._isDirty = false;

  var imports = {};

  // find unique modules
  Object.keys(this._map).forEach(function(filePath) {
    (Object.keys(this._map[filePath] || {})).forEach(function(moduleName) {
      imports[moduleName] = true;
    });
  }, this);

  // generate stub
  this._amd = Object.keys(imports).sort().map(function(moduleName) {
    return "define('npm:" + moduleName + "', function(){ return { 'default': require('" + moduleName + "')};})";
  }).join("\n");

  return this._amd;
};

function importsFor(src, fullPath) {
  try {
    return parseModule(src);
  } catch (error) {
    throw new Error('Error parsing code while looking for "npm:" imports: ' + error.stack || error + ' in file: ' + fullPath);
  }
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

function head(array) {
  return array[0];
}

function parseModule(src) {
  var amdImports = {};
  var es6Imports = {};

  var ast = acorn.parse(src, {
    ecmaVersion: 6,
    sourceType: 'module'
  });

  forEachNode(ast, function(entry) {
    if (entry.type === 'CallExpression' && entry.callee.name === 'define') {
      findAMDImports(entry, amdImports);
    } else if (entry.type === 'ImportDeclaration') {
      findES6Imports(entry, es6Imports);
    }
  });

  // If any ES6 import statements were found, ignore anything that looked like a module `define` invocation
  if (Object.keys(es6Imports).length) {
    return es6Imports;
  } else {
    return amdImports;
  }
}

function findAMDImports(entry, imports) {
  head(entry.arguments.filter(function(item) {
    return item.type === 'ArrayExpression';
  })).elements.filter(function(element) {
    return element.value.slice(0, 4) === 'npm:';
  }).forEach(function(element) {
    imports[element.value.slice(4)] = true;
  });
}

function findES6Imports(entry, imports) {
  var source = entry.source.value;
  if (source.slice(0,4) === 'npm:') {
    if (entry.kind === 'named') {
      throw new Error("ember-browserify doesn't support named imports (you tried to import " + entry.specifiers[0].id.name +  " from " + source);
    }
    imports[source.slice(4)] = true;
  }
}
