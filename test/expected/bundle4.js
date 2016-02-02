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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9icm93c2VyaWZ5X3N0dWJzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL215LW1vZHVsZS9pbmRleC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9teS1tb2R1bGUvbm9kZV9tb2R1bGVzL290aGVyLWRlcGVuZGVuY3kvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJkZWZpbmUoJ25wbTpteS1tb2R1bGUnLCBmdW5jdGlvbigpeyByZXR1cm4geyBkZWZhdWx0OiByZXF1aXJlKCdteS1tb2R1bGUnKX07fSlcbiIsInZhciBvdGhlciA9IHJlcXVpcmUoJ290aGVyLWRlcGVuZGVuY3knKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gb3RoZXIuc29tZXRoaW5nKCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gNDI7XG59O1xuIl19
