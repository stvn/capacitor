var through = require('through');

/**
 * capacitor_stream()
 * @param  {Object} state    a capacitor state
 * @param  {String} property property name on state
 * @param  {Stream} dest a stream to pipe to
 * @return {Stream}          a node stream
 *
 * If `state[property]` is a stream, return it.
 * Otherwise replace the property with a new stream.
 */
module.exports = function capacitor_stream(state, property, dest) {
  var stream;

  // if we've already converted from a fn -> stream, return it.
  if (typeof state[property] !== 'function') {
    return state[property];
  }

  // make a new stream that we can later write to
  stream = through();
  // call the event handler, which should pipe `this` into something
  state[property].call(stream).pipe(dest);
  // replace the original handler with the new stream
  state[property] = stream;

  // return the outer stream that currents can be written to
  return stream;
}