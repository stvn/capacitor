var Promise = require('bluebird'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    CapacitorApiError = require('./capacitor_api_error');

var Capacitor = function() {
  this.plugins = {};
  this.states = {};
  EventEmitter.call(this);
};

/**
 * Capacitor.events
 * catalog of events that may be emitted by a Capacitor instance.
 * @type {Object}
 */
Capacitor.events = {
  INVALID_RUN: 'Capacitor.INVALID_RUN',
  WILL_RUN: 'Capacitor.WILL_RUN',
  DID_RUN: 'Capacitor.DID_RUN'
};

// Capacitor instanceof EventEmitter
util.inherits(Capacitor, EventEmitter);

/**
 * Constructor
 */
Capacitor.prototype.constructor = Capacitor;

/**
 * plugin()
 * @param  {String}   name name of the plugin
 * @param  {Function} fn   function defining the plugin
 * @return {None}        no return value
 */
Capacitor.prototype.plugin = function(name, fn) {
  if (!name || typeof fn !== 'function' || fn.length !== 2) {
    throw new CapacitorApiError('Capacitor: plugin() accepts string name and function or arity 2.');
  }
  this.plugins[name] = fn;
};

/**
 * state()
 * @param  {Object} state state definition
 * @return {None}       no return value
 */
Capacitor.prototype.state = function(state) {
  if (typeof state.name !== 'string' || !state.name) {
    throw new CapacitorApiError('Capacitor: state() accepts object with a String .name');
  }
  this.states[state.name] = state;
};

/**
 * run()
 * @param  {String} eventName name of the event to process
 * @param  {Object|Array|literal} eventData event value. if you need more than one param, wrap them.
 * @return {None}           no return value
 *
 * Runs an event in the system - determines the current state and sends the event to the handler
 * defined there. if the state does not accept the event, emits `Capacitor.events.UNDEFINED_EVENT`.
 *
 * Event sequence:
 *   emit `WILL_RUN`
 *   if no handler: emit `UNDEFINED_EVENT`
 *   if handler: (runs event)
 *   emit `DID_RUN`
 *   
 *  If an error occurrs at any point in the above, `ERROR` is thrown
 */
Capacitor.prototype.run = function(eventName, eventData) {
  if (typeof eventName !== 'string' || !eventName) {
    this.emit(Capacitor.events.INVALID_RUN, eventName, eventData);
    return;
  }
  this.emit(Capacitor.events.WILL_RUN, eventName, eventData);
  this.emit(Capacitor.events.DID_RUN, eventName, eventData);
};

module.exports = Capacitor;