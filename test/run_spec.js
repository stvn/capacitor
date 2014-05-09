var assert = require('chai').assert,
    sinon = require('sinon'),
    Promise = require('bluebird'),
    Capacitor = require('../'),
    CapacitorApiError = require('../src/capacitor_api_error');

describe('Capacitor#run()', function() {
  var flux, state;

  beforeEach(function() {
    flux = new Capacitor();
    state = {
      name: 'test',
      testEvent: function() {
        return this;
      }
    }
    flux.state(state);
    flux.initialize(state.name);
  });

  it('should emit an INVALID_RUN event on invalid params', function() {
    var emits, handler;
    emits = [
      [],
      [null],
      [null,null],
      [1],
      ['']
    ];
    handler = sinon.spy();
    
    flux.on(Capacitor.events.INVALID_RUN, handler);
    emits.forEach(function(emit, index) {
      flux.run.apply(flux, emit);
      assert.ok(handler.called, 'INVALID_RUN called');
      assert.equal(handler.callCount, index+1, 'INVALID_RUN called expected number of times');
    });
  });

  it('should emit a WILL_RUN event on valid params', function() {
    var invalidHandler = sinon.spy(),
      willRunHandler = sinon.spy(),
      didRunHandler = sinon.spy(),
      eventName = 'testEvent',
      eventData = {};
    flux.on(Capacitor.events.INVALID_RUN, invalidHandler);
    flux.on(Capacitor.events.WILL_RUN, willRunHandler);
    flux.on(Capacitor.events.DID_RUN, didRunHandler);

    flux.run(eventName, eventData);

    assert.notOk(invalidHandler.called, 'INVALID_RUN called');

    assert.ok(willRunHandler.called, 'WILL_RUN called');
    assert.equal(willRunHandler.args[0][0].name, eventName, 'WILL_RUN called with expected args');
    assert.equal(willRunHandler.args[0][0].data, eventData, 'WILL_RUN called with expected args');

    assert.ok(didRunHandler.called, 'DID_RUN called');
    assert.equal(didRunHandler.args[0][0].name, eventName, 'DID_RUN called with expected args');
    assert.equal(didRunHandler.args[0][0].data, eventData, 'DID_RUN called with expected args');
  });
});