'use strict';

var acorn = require('acorn');
module.exports = importsFor;
function importsFor(src, fullPath) {
  // In ember cli 2.x, src is es5 code, whereas in ember cli 1.x, src is still es6 code.

  // First, try to parse as es5 code. Es6 code will return an error.
  var result = tryCatch(parseEs5, src);
  // If a syntax error is thrown, we assume this is because src is es6 code.
  if (result instanceof Error) {
    result = tryCatch(parseEs6, src);
  }

  // If result is still an error, there must have been a parse error
  if (result instanceof Error) {
    throw new Error('Error parsing code while looking for "npm:" imports: ' + result.stack || result + ' in file: ' + fullPath);
  }

  return result;
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
