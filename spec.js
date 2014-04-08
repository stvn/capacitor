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
      didEvent: sinon.stub()
    };
    fsm = new FSM(fsmEvents);
    state = makeState('initial');
  })

  it('should create a new instance via constructor', function() {
    assert.ok(fsm, 'should have an object');
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
        assert.notOk(fsmEvents.didEvent.called, 'should not call fsm#didEvent');
      })
      .then(done).catch(done)
    })

    it('should call event handler for known event', function(done) {
      event = 'knownEvent';
      state[event] = sinon.spy();
      initFsm().then(function() {
        return fsm.emit(event, params)
        .then(function() {
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');

          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.notOk(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
          assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didEvent.called, 'should call fsm#didEvent');
          assert.ok(fsmEvents.didEvent.calledWith(event, params, false), 'should call fsm#didEvent w correct args');
        })
      })
      .then(done).catch(done)
    })

    it('should call fsm#onInvalid when state name is invalid', function(done) {
      event = 'notTransitionSameName';
      state[event] = sinon.stub().returns('invalid');
      initFsm().then(function() {
        return fsm.emit(event, params)
        .then(function() {
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');

          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.ok(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.ok(fsmEvents.onInvalid.calledWith('invalid'), 'should call fsm#onInvalid with the invalid state name');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
          assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didEvent.called, 'should call fsm#didEvent');
          assert.ok(fsmEvents.didEvent.calledWith(event, params, false), 'should call fsm#didEvent w correct args');
        })
      })
      .then(done).catch(done)
    })

    it('should not transition when event returns same state name', function(done) {
      event = 'notTransitionSameName';
      state[event] = sinon.stub().returns(state.name);
      initFsm().then(function() {
        return fsm.emit(event, params)
        .then(function() {
          assert.notOk(state.onMissing.called, 'state#onMissing should not be called');
          assert.ok(state[event].called, 'event handler should be called');
          assert.ok(state[event].calledWith(params), 'event handler should be called w params');

          assert.notOk(fsmEvents.onConflict.called, 'should not call fsm#onConflict');
          assert.notOk(fsmEvents.onInvalid.called, 'should not call fsm#onInvalid');
          assert.notOk(fsmEvents.onError.called, 'should not call fsm#onError');
          assert.notOk(fsmEvents.willTransition.called, 'should not call fsm#willTransition');
          assert.notOk(fsmEvents.didTransition.called, 'should not call fsm#didTransition');
          assert.ok(fsmEvents.didEvent.called, 'should call fsm#didEvent');
          assert.ok(fsmEvents.didEvent.calledWith(event, params, false), 'should call fsm#didEvent w correct args');
        })
      })
      .then(done).catch(done)
    })

    it('should call fsm#onConflict when event already processing', function(done) {
      event = 'eventInProgress';
      state[event] = sinon.stub().returns('otherState');
      initFsm().then(function() {
        fsm.emit(event, params)
        assert.ok(fsm.isTransitioning());
        fsm.emit(event, params)
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
        return fsm.emit(event, params)
        .then(function() {
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
          assert.ok(fsmEvents.didEvent.called, 'should call fsm#didEvent');
          assert.ok(fsmEvents.didEvent.calledWith(event, params, true), 'should call fsm#didEvent w correct args');

          // events should fire in order
          assert.ok(state[event].calledBefore(fsmEvents.willTransition));
          assert.ok(fsmEvents.willTransition.calledBefore(state.leave));
          assert.ok(state.leave.calledBefore(newState.enter));
          assert.ok(newState.enter.calledBefore(fsmEvents.didTransition));
          assert.ok(fsmEvents.didTransition.calledBefore(fsmEvents.didEvent));
          assert.equal(fsm.current, newState, 'should be at new state');
        })
      })
      .then(done).catch(done)
      state._leave.resolve();
      newState._enter.resolve();
    })
  })

  describe('initialization', function() {
    it('should throw an error initializing to unknown state', function() {
      assert.throws(fsm.initialize.bind(fsm, 'wtf?'), FSM.InvalidStateError);
    })

    it('should not throw an error if event emitted before initialized', function() {
      assert.doesNotThrow(fsm.emit.bind(fsm, 'event'), Error);
    })

    it('should throw an error if initialized twice', function() {
      fsm.define(state);
      fsm.initialize(state.name);
      assert.throws(fsm.initialize.bind(fsm, 'initial'), FSM.AlreadyInitializedError);
    })

    it('should call fsm#onConflict if event emitted before initialized', function() {
      fsm.define(state);
      fsm.emit(event, params);
      assert(fsmEvents.onConflict.calledOnce, 'fsm onConflict should be called');
      assert(fsmEvents.onConflict.calledWith(event, params), 'fsm onConflict should be called with correct args');
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
