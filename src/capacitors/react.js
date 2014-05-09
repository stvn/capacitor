var React = require('react'),
    through = require('through2'),
    rootEl = null;

/**
 * reactCapacitor()
 * @param  {ReactComponent} component a react class
 * @return {None}           no return value (pipes)
 */
function reactCapacitor(component) {
  return through.obj(function(current, enc, callback) {
    React.renderComponent(component(current.data), rootEl);
    this.push(current);
    return callback();
  }); 
};

/**
 * setRoot()
 * @param {DOMElement} el a DOM element to render into
 */
reactCapacitor.setRoot = function(el) {
  rootEl = el || reactCapacitor.getRoot();
};

/**
 * getRoot()
 * @return {DOMElement} get the currently set root dom element
 */
reactCapacitor.getRoot = function() {
  return rootEl || document.documentElement; 
};

module.exports = reactCapacitor;