module.exports = function rewriteImports(content, data) {
  var lines = content.split('\n');
  var offsets = [];

  Object.keys(data).forEach(function(name) {
    var line = data[name].start.line - 1;

    if (offsets[line] === undefined) {
      offsets[line] = 0;
    }

    var start = data[name].start.column + offsets[line];
    var end = data[name].end.column + offsets[line];
    var version = data[name].version;

    var pre = lines[line].substring(0, start);
    var moduleString = '"npm:' + name + '@' + version + '"';
    var post = lines[line].substring(end);

    lines[line] = [pre, moduleString, post].join('');

    // Every time we make a replacement we need to adjust the offsets.
    // We know that, by rule, these offsets will come in order.
    // This means we only need to store the total cumulative offset. 
    offsets[line] += moduleString.length - (end - start); 
  });

  return lines.join('\n');
};