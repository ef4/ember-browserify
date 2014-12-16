(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./browserify_stubs.js":[function(require,module,exports){
define('npm:my-module', function(){ return { default: require('my-module')};})

},{"my-module":"/node_modules/my-module/index.js"}],"/node_modules/my-module/index.js":[function(require,module,exports){
var other = require('other-dependency');

module.exports = function(){
  return other.something();
};

},{"other-dependency":"/node_modules/my-module/node_modules/other-dependency/index.js"}],"/node_modules/my-module/node_modules/other-dependency/index.js":[function(require,module,exports){
module.exports = function(){
  return 42;
};

},{}]},{},["./browserify_stubs.js"]);
