var assert = require('chai').assert;
var sinon = require('sinon');
var FSM = require('./');
var Promise = require('bluebird');

describe('FSM', function() {
  var fsm, fsmEvents, state, event, params;

  var makeState = function(name) {
    var newState = {
      name: name,
      onMissing: sinon.stub(),
      onConflict: sinon.stub()
    }
    //  to resolve/reject:
    //  someState._leave.resolve(value)
    //  someState._leave.reject(err)
    newState._enter = Promise.defer();
    newState.enter = sinon.stub().returns(newState._enter.promise);
    //  to resolve/reject:
    //  someState._leave.resolve(value)
    //  someState._leave.reject(err)
    newState._leave = Promise.defer();
    newState.leave = sinon.stub().returns(newState._leave.promise);
    return newState;
  }

  // initialize the FSM with the default state (unless {skipState:true})
  // and return the promise from .initialize()
  var initFsm = function(options) {
    var promise;
    if (!options || !options.skipDefine) {
      fsm.define(state);
    }
    promise = fsm.initialize(state.name)
    .then(function() {
      fsmEvents.didTransition.reset();
    })
    state._enter.resolve();
    return promise;
  }

  beforeEach(function() {
    event = 'event';
    params = {};
    fsmEvents = {
      onInvalid: sinon.stub(),
      onError: sinon.stub(),
      onConflict: sinon.stub(),
      willTransition: sinon.stub(),
      didTransition: sinon.stub(),
      willEmit: sinon.stub(),
      didEmit: sinon.stub()
    };
    fsm = new FSM(fsmEvents);
    state = makeState('initial');
  })

  it('should create a new instance via constructor', function() {
    assert.ok(fsm, 'should have an object');
  })

  describe('api functions are pre-bound to FSM instance', function() {
    it('should bind #emit() to instance', function(done) {
      event = 'emitsState';
      var stateName = 'eventEventsState';
      state[event] = sinon.stub().returns(stateName);
      initFsm().then(function() {
        var emit = fsm.emit; // if fsm.emit not already bind()-ed, will loose the `this` value
        emit(event)
        return fsm.queuePromise.then(function() {
          assert.ok(fsmEvents.onInvalid.called, 'should call onInvalid');
          assert.ok(fsmEvents.onInvalid.calledWith(stateName), 'should try but fail to transition to emitted state');
        })
      })
      .then(done).catch(done)
    })
  })

  describe('state functions', function() {
    it('should attach a reference to the state machine to each defined state', function(done) {
      initFsm().then(function() {
        assert.equal(state.fsm, fsm, 'state should have .fsm reference to state machine')
      })
      .then(done).catch(done)
    })
  })

  describe('events', function() {
    it('should call onMissing for unknown event', function(done) {
      event = 'unknownEvent';
      initFsm().then(function() {
        fsm.emit(event, params)
        assert.ok(state.onMissing.called, 'state#onMissing should be called');
        assert.ok(state.onMissing.calledWith(event, params), 'state#onMissing called w correct args');

        assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
        assert.notOk(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
        assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
        assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
        assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
        assert.notOk(fsmEvents.didEmit.called, 'should not call fsm#didEmit');
      })
      .then(done).catch(done)
    })

    it('should call event handler for known event', function(done) {
      event = 'knownEvent';
      state[event] = sinon.spy();
      initFsm().then(function() {
        fsm.emit(event, params)
        return fsm.queuePromise.then(function() {
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');

          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.notOk(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
          assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didEmit.called, 'should call fsm#didEmit');
          assert.ok(fsmEvents.didEmit.calledWith(event, params, false), 'should call fsm#didEmit w correct args');
        })
      })
      .then(done).catch(done)
    })

    it('should call fsm#onInvalid when state name is invalid', function(done) {
      event = 'notTransitionSameName';
      state[event] = sinon.stub().returns('invalid');
      initFsm().then(function() {
        fsm.emit(event, params)
        return fsm.queuePromise.then(function() {
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');

          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.ok(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.ok(fsmEvents.onInvalid.calledWith('invalid'), 'should call fsm#onInvalid with the invalid state name');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
          assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didEmit.called, 'should call fsm#didEmit');
          assert.ok(fsmEvents.didEmit.calledWith(event, params, false), 'should call fsm#didEmit w correct args');
        })
      })
      .then(done).catch(done)
    })

    it('should not transition when event returns same state name', function(done) {
      event = 'notTransitionSameName';
      state[event] = sinon.stub().returns(state.name);
      initFsm().then(function() {
        fsm.emit(event, params)
        return fsm.queuePromise.then(function() {
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');

          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.notOk(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
          assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didEmit.called, 'should call fsm#didEmit');
          assert.ok(fsmEvents.didEmit.calledWith(event, params, false), 'should call fsm#didEmit w correct args');
        })
      })
      .then(done).catch(done)
    })

    it('should call fsm#onConflict when event already processing', function(done) {
      var defer = Promise.defer();
      event = 'eventInProgress';
      state[event] = sinon.stub().returns(defer.promise);
      initFsm().then(function() {
        fsm.emit(event, params);
        assert.ok(fsm.isTransitioning());
        fsm.emit(event, params);
        assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
        assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
        assert.ok(state.onConflict.called, 'should call state#onConflict');
        assert.ok(state.onConflict.calledWith(event, params), 'call state#onConflict w correct args');
      })
      .then(done).catch(done)
    })

    it('should not call fsm#onConflict when previous event finished processing', function(done) {
      var defer = Promise.defer();
      event = 'eventFinished';
      state[event] = sinon.stub().returns(defer.promise);
      initFsm().then(function() {
        fsm.emit(event, params);

        // resolve the initial event handler
        defer.resolve();

        // next tick verify that new event gets no onConflict
        var doneDefer = Promise.defer();
        setTimeout(function() {
          fsm.emit(event, params)
          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.notOk(state.onConflict.called, 'should not call state#onConflict');
          doneDefer.resolve();
        }, 1)
        return doneDefer.promise;
      })
      .then(done).catch(done)
    })

    it('should transition when event returns different, valid state name', function(done) {
      event = 'newStateTransition';
      var newState = makeState('newState');
      fsm.define(newState);
      state[event] = sinon.stub().returns(newState.name);
      initFsm().then(function() {
        fsm.emit(event, params)
        return fsm.queuePromise.then(function() {
          // state-specific enter/leave should be called
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');
          assert.ok(state.leave.called, 'should call state#leave');
          assert.ok(newState.enter.called, 'should call newState#enter');

          // error events should not fire
          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.notOk(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');

          // transition lifecycle event should fire
          assert.ok(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.ok(fsmEvents.willTransition.calledWith(state, newState), 'should call fsm#willTransition w correct args');
          assert.ok(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didTransition.calledWith(newState), 'should call fsm#didTransition w correct args');
          assert.ok(fsmEvents.willEmit.called, 'should call fsm#willEmit');
          assert.ok(fsmEvents.willEmit.calledWith(event, params), 'should call fsm#willEmit w correct args');
          assert.ok(fsmEvents.didEmit.called, 'should call fsm#didEmit');
          assert.ok(fsmEvents.didEmit.calledWith(event, params, true), 'should call fsm#didEmit w correct args');

          // events should fire in order
          assert.ok(fsmEvents.willEmit.calledBefore(state[event]), 'willEmit > event');
          assert.ok(state[event].calledBefore(fsmEvents.didEmit), ' event -> didEmit');
          assert.ok(fsmEvents.didEmit.calledBefore(fsmEvents.willTransition), 'didEmit > willTransition');
          assert.ok(fsmEvents.willTransition.calledBefore(state.leave), 'willTransition > leave');
          assert.ok(state.leave.calledBefore(newState.enter), 'leave > enter');
          assert.ok(newState.enter.calledBefore(fsmEvents.didTransition), 'enter > didTransition');
          assert.equal(fsm.current, newState, 'should be at new state');
        })
      })
      .then(done).catch(done)
      state._leave.resolve();
      newState._enter.resolve();
    })

    it('should process queued events on same state when no transition', function(done) {
      var startEvent = 'firstEvent';
      var startDefer = Promise.defer();
      var nextEvent = 'nextEvent';
      var nextDefer = Promise.defer();
      state[startEvent] = sinon.stub().returns(startDefer.promise);
      state[nextEvent] = sinon.stub().returns(nextDefer.promise);

      var newState = makeState('newState');
      newState[startEvent] = sinon.stub().returns(startDefer.promise);
      newState[nextEvent] = sinon.stub().returns(nextDefer.promise);
      fsm.define(newState);

      initFsm().then(function() {
        fsm.emit(startEvent);
        fsm.emit(nextEvent);

        assert.ok(state[startEvent].called, 'first event called on first state');
        assert.notOk(state[nextEvent].called, 'next event not yet called on first state');

        return Promise.delay(10)
        .then(function() {
          assert.ok(state[nextEvent].called, 'next event called on first state');
        })
      }) 
      .then(done).catch(done);
      startDefer.resolve();
      nextDefer.resolve();
    })

    it('should process queued events on different state after a transition', function(done) {
      var startEvent = 'firstEvent';
      var startDefer = Promise.defer();
      var nextEvent = 'nextEvent';
      var nextDefer = Promise.defer();
      state[startEvent] = sinon.stub().returns(startDefer.promise);
      state[nextEvent] = sinon.stub().returns(nextDefer.promise);

      var newState = makeState('newState');
      newState[startEvent] = sinon.stub().returns(startDefer.promise);
      newState[nextEvent] = sinon.stub().returns(nextDefer.promise);
      fsm.define(newState);

      initFsm().then(function() {
        fsm.emit(startEvent);
        fsm.emit(nextEvent);

        assert.ok(state[startEvent].called, 'first event called on first state');
        assert.notOk(state[nextEvent].called, 'next event never called on first state');
        assert.notOk(newState[startEvent].called, 'first event never called on second state');
        assert.notOk(newState[nextEvent].called, 'next event not yet called on second state');

        return Promise.delay(10)
        .then(function() {
          assert.notOk(state[nextEvent].called, 'next event never called on first state');
          assert.notOk(newState[startEvent].called, 'first event never called on second state');
          assert.ok(newState[nextEvent].called, 'next event called on second state');
        })
      }) 
      .then(done).catch(done);
      startDefer.resolve(newState.name);
      nextDefer.resolve();
      state._leave.resolve();
      newState._enter.resolve();
    });
  })

  describe('initialization', function() {
    it('should throw an error initializing to unknown state', function() {
      assert.throws(fsm.initialize.bind(fsm, 'wtf?'), FSM.InvalidStateError);
    })

    it('should not throw an error if event emitted before initialized', function() {
      try {
        fsm.emit('event');
      } catch (e) {
        console.error(e);
      }
      assert.doesNotThrow(fsm.emit.bind(fsm, 'event'), Error);
    })

    it('should throw an error if initialized twice', function() {
      fsm.define(state);
      fsm.initialize(state.name);
      assert.throws(fsm.initialize.bind(fsm, 'initial'), FSM.AlreadyInitializedError);
    })

    it('should queue events emitted before initialized', function() {
      fsm.define(state);
      fsm.emit(event, params);
      assert.notOk(fsm.isTransitioning(), 'should not be transitioning yet');
      fsm.initialize(state.name)
      .then(function() {
        assert.ok(fsm.isTransitioning(), 'should now be processing queue');
        assert.ok(state[event].called, 'should call event');
      })
    })

    it('should call state#onConflict if event emitted during initialization', function() {
      fsm.define(state);
      fsm.initialize(state.name);
      fsm.emit(event, params);
      assert.notOk(fsmEvents.onConflict.called, 'fsm#onConflict should not be called');
      assert.ok(state.onConflict.calledOnce, 'state#onConflict should be called');
      assert.ok(state.onConflict.calledWith(event, params), 'state#onConflict should be called w correct args');
    })

    it('should synchronously initialize to a state', function(done) {
      state.enter = function() { return true; }
      fsm.define(state);
      var res = fsm.initialize(state.name);
      assert.ok(Promise.is(res), 'initialize() should return a promise');
      assert.ok(fsm.isTransitioning(), 'should be transitioning until promise returns');

      res.then(function(value) {
        assert.notOk(fsm.isTransitioning(), 'should be transitioning until promise returns');
        assert.ok(fsmEvents.didTransition.called, 'should call fsm#didTransition');
        assert.ok(fsmEvents.didTransition.calledWith(state), 'call fsm#didTransition w correct args');
      })
      .then(done).catch(done)
    })

    it('should asynchronously initialize to a state', function(done) {
      fsm.define(state);
      var res = fsm.initialize(state.name);
      assert.ok(Promise.is(res), 'initialize() should return a promise');
      assert.ok(fsm.isTransitioning(), 'should be transitioning until promise returns');

      res.then(function(value) {
        assert.notOk(fsm.isTransitioning(), 'should be transitioning until promise returns');
        assert.ok(fsmEvents.didTransition.called, 'should call fsm#didTransition');
        assert.ok(fsmEvents.didTransition.calledWith(state), 'call fsm#didTransition w correct args');
      })
      .then(done).catch(done)

      setTimeout(function() {
        state._enter.resolve(true);
      }, 1);
    })
  })
})
