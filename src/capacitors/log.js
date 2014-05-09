var through = require('through2');

/**
 * logCapacitor()
 * @return {None}
 */
function logCapacitor() {
  return through.obj(function(current, enc, callback) {
    // log event name and inspect the data
    console.log(current.name);
    console.dir(current.data);

    this.push(current);
    return callback();
  });
};

module.exports = logCapacitor;