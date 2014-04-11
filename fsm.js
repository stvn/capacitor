var util = require('util');
var _ = require('lodash');
var Promise = require('bluebird');
var nop = function() {}; //no op

/*
 *  FSM
 *  Finite State Machine implementation with asynchronous support
 */
var FSM = function(events, stateDefault) {
  this.current = null;
  this.states = {};
  this.transitionPromise = null;
  this.events = _.defaults(events || {}, {
    onInvalid: nop,
    onError: nop,
    onConflict: nop,
    willTransition: nop,
    didTransition: nop,
    didEvent: nop
  });
  this.stateDefault = _.defaults(stateDefault || {}, {
    leave: nop,
    enter: nop,
    onMissing: nop,
    onConflict: nop
  });

  // bind locally
  this.emit = this.emit.bind(this);
  this.define = this.define.bind(this);
  this.isTransitioning = this.isTransitioning.bind(this);
  this.initialize = this.initialize.bind(this);
};

/*
 *  FSM.InvalidStateError
 *  Triggered when a state definition is invalid.
 */
FSM.InvalidStateError = function(message) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
}
util.inherits(FSM.InvalidStateError, Error);

/*
 *  FSM.NotInitializedError
 *  Triggered when a state definition is invalid.
 */
FSM.NotInitializedError = function(message) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
}
util.inherits(FSM.NotInitializedError, Error);

/*
 *  FSM.AlreadyInitializedError
 *  Triggered when a state definition is invalid.
 */
FSM.AlreadyInitializedError = function(message) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
}
util.inherits(FSM.AlreadyInitializedError, Error);


FSM.prototype._missing = function(eventName, params) {
  try {
    this.current.onMissing(eventName, params);
  } catch (err) {
    this.events.onError(err);
  }
}
FSM.prototype._conflict = function(eventName, params) {
  try {
    if (this.current) {
      this.current.onConflict(eventName, params);
    } else {
      this.events.onConflict(eventName, params);
    }
  } catch (err) {
    this.events.onError(err);
  }
}

/*
 *  emit(eventName, params[, options])
 *  @param {String} eventName: string event name
 *  @param {Object|Array|literal} params: object/array/literal value to pass to current state's event handler
 *  @return {Promise} a promise/a+ compliant promise that resolves when event completes
 *
 *  emit an event against the current state
 */
FSM.prototype.emit = function(eventName, params) {
  // handle transition in progress
  if (!this.current || this.transitionPromise !== null) {
    return this._conflict(eventName, params);
  }
  // handle missing event name
  if (!eventName || typeof this.current[eventName] !== 'function') {
    return this._missing(eventName, params);
  }
 
  // handle the event 
  this.transitionPromise = new Promise(function(resolve) {
    this.events.willEmit(eventName, params);
    resolve(this.current[eventName].call(this.current, params));
  }.bind(this))
  .bind(this)
  .then(function(stateName) {
    var willTransition = true;

    // do nothing unless event handler returns a state name
    if (!stateName || stateName === this.current.name) {
      willTransition = false;
    } else if (!(stateName in this.states)) {
      // error if state name is unknown
      this.events.onInvalid(stateName);
      willTransition = false;
    }

    // callback that event occurred
    this.events.didEmit(eventName, params, willTransition);

    // exit if not transitioning
    if (!willTransition) {
      return false;
    }

    // otherwise leave current state
    this.events.willTransition(this.current, this.states[stateName]);
    return Promise.cast(this.current.leave())
    .bind(this)
    .then(function() {
      // and enter new state
      this.current = this.states[stateName];
      return Promise.cast(this.current.enter());
    })
    .then(function() {
      return true;
    })
  })
  .then(function(didTransition) {
    if (didTransition) {
      this.events.didTransition(this.current);
    }
  })
  .catch(function(err) {
    this.events.onError(err);
  })
  .finally(function() {
    // reset that transition is complete
    this.transitionPromise = null;
  })

  return this.transitionPromise;
}

/*
 *  isTransitioning()
 *  @return {boolean} true if transitioning, false otherwise
 */
FSM.prototype.isTransitioning = function() {
  return this.transitionPromise !== null;
}

/*
 *  define(stateName, definition)
 *  @param {Object} definition: definition of the state
 *
 *  defines a new state
 */
FSM.prototype.define = function(definition) {
  if (typeof definition.name !== 'string' || !definition.name) {
    throw new FSM.InvalidStateError('State must have a .name');
  }
  this.states[definition.name] = _.defaults(definition, this.stateDefault);
}

/*
 *  initialize(stateName)
 *  @param {String} stateName: the initial state of the system
 *
 *  initialize the state machine at the starting state. `enter()` 
 *  will be called on the state.
 */
FSM.prototype.initialize = function(stateName) {
  if (this.current !== null) {
    throw new FSM.AlreadyInitializedError('Already Initialized, cannot go to: ' + stateName);
  }
  if (!stateName || !(stateName in this.states)) {
    throw new FSM.InvalidStateError('Invalid State: ' + stateName);
  }
  var promise = new Promise(function(resolve) {
    this.current = this.states[stateName];
    resolve(Promise.cast(this.current.enter()));
  }.bind(this))
  .bind(this)
  .then(function() {
    this.events.didTransition(this.current);
  })
  .finally(function() {
    this.transitionPromise = null;
  })

  this.transitionPromise = promise;
  return promise;
}

module.exports = FSM;