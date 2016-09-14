'use strict';

var acorn = require('acorn');

module.exports = importsFor;
function importsFor(src, fullPath) {
  var result = parse(src);

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

function parse(src) {
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
