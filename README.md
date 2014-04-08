fsmp
====

Promise-based asynchronous Finite State Machine for node/browserify

## Install
TODO: not yet published to npm.

    # npm install fsmp

## Usage

### Constructor

    var FSM = require('fsm');
    var fsm = new FSM();

### Define States

Use `#define()` to create a state.

    fsm.define({
      name: 'stateName',
      enter: function() {}, // callback when entering the state
      leave: function() {}, // callback before leaving the state
      onConflict: function(eventName, params) {}, // callback when event occurs before previous event finishes
      onMissing: function(eventName, params) {}, // callback when event name is not defined on this state
      eventName: function() { ... }
    })
    
Use `#initialize()` to start the fsm in its initial state. This will call the state's `enter()` callback.

    fsm.define({name:'start', ...})
    fsm.initialize('start')
    
Use `#emit()` to emit an event on the current state:

    fsm.emit('eventName', {...params...})
    
## Example

Event handlers can return a falsy value to do nothing (eg side-effects only). If a string is returned, the FSM will transition to the state with that name.

    var fsm = new FSM();
    fsm.define({
      name: 'ping',
      noResult: function() {}, // this event returns nothing, so will not transition
      ping: function() {
        return 'pong'; // this event returns a string, and will transition to 'pong' state
      }
    })
    fsm.define({
      name: 'pong',
      pong: function() {
        return 'ping'; // transitions back to 'ping' state
      }
    })
    fsm.initialize('ping'); // initialize into the 'ping' state which accepts 'ping' events
    fsm.emit('ping'); // run the 'ping' event on current state
    // => now in the 'pong' state
    fsm.emit('pong') // run the 'pong' event on current state
    // => now in the 'ping' state
    fsm.emit('pong') // does nothing: 'ping' state has no 'pong' event
    
## Asyncrhonous Example

Event handler functions can return a promise which resolves to a state name: in this case the FSM will be in a transitioning state until the current event completes. Subsequent events during processing will cause the state's `onConflict` handler to be called.

    var Promise = require('bluebird');
    var fsm = new FSM();
    fsm.define({
      name: 'ping',
      ping: function() {
        return new Promise(function(resolve) {
          setTimeout(resolve.bind(this, 'pong'), 1000);
        })
      }
    })
    fsm.define({
      name: 'pong',
      pong: function() {
        return new Promise(function(resolve) {
          setTimeout(resolve.bind(this, 'ping'), 1000);
        })
      }
    })
    fsm.initialize('ping'); // initialize into the 'ping' state which accepts 'ping' events
    fsm.emit('ping'); // run the 'ping' event on current state
    // no immediate transition...
    // => 1000ms later, now in the 'pong' state
    fsm.emit('pong') // run the 'pong' event on current state
    // no immediate transition...
    // => 1000ms later, now in the 'ping' state
    fsm.emit('pong') // does nothing: 'ping' state has no 'pong' event
