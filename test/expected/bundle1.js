(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
define('npm:my-module', function(){ return { default: require('my-module')};})

},{"my-module":2}],2:[function(require,module,exports){
var other = require('other-dependency');

module.exports = function(){
  return other.something();
};

},{"other-dependency":3}],3:[function(require,module,exports){
module.exports = function(){
  return 42;
};

},{}]},{},[1]);
