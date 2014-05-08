var assert = require('chai').assert,
    sinon = require('sinon'),
    Promise = require('bluebird'),
    Capacitor = require('../'),
    CapacitorApiError = require('../src/capacitor_api_error');

describe('Capacitor core API', function() {
  var flux;

  beforeEach(function() {
    flux = new Capacitor();
  });

  describe('plugin()', function() {
    it('should reject invalid plugins', function() {
      var plugins = [
        [],
        [null],
        [undefined],
        [false],
        [1],
        [1,1]
        ['name'],
        ['name', function(){}],
        ['name', function(a){}],
        ['name', function(a,b,c){}]
      ];

      plugins.forEach(function(plugin) {
        assert.throw(function() {
          flux.plugin.apply(flux, plugin);
        }, CapacitorApiError);
      })
    });

    it('should accept valid plugins', function() {
      assert.doesNotThrow(function() {
        flux.plugin('name', function(a,b){});
      })
    });
  });

  describe('state()', function() {
    it('should reject invalid states', function() {
      var states = [
        [],
        {},
        {name:false},
        {name:null},
        {name:''}
      ];
      states.forEach(function(state) {
        assert.throw(function() {
          flux.state(state)
        }, CapacitorApiError);
      });
    });

    it('should accept valid states', function() {
      assert.doesNotThrow(function() {
        flux.state({
          name: 'a'
        });
      });
    });
  });

  describe('on()', function() {
    it('should be an event emitter', function() {
      assert.doesNotThrow(function() {
        flux.on('event', function(){})
      });
    });
  });

  describe('run()', function() {
    it('should emit an INVALID_RUN event on invalid params', function() {
      var emits = [
        [],
        [null],
        [null,null],
        [1],
        ['']
      ];
      var handler = sinon.spy();
      flux.on(Capacitor.events.INVALID_RUN, handler);
      emits.forEach(function(emit, index) {
        flux.run.apply(flux, emit);
        assert.ok(handler.called, 'INVALID_RUN called');
        assert.equal(handler.callCount, index+1, 'INVALID_RUN called expected number of times');
      })
    });

    it('should not emit a WILL_RUN event on valid params', function() {
      var invalidHandler = sinon.spy(),
        willRunHandler = sinon.spy(),
        didRunHandler = sinon.spy(),
        eventName = 'event',
        eventData = {};
      flux.on(Capacitor.events.INVALID_RUN, invalidHandler);
      flux.on(Capacitor.events.WILL_RUN, willRunHandler);
      flux.on(Capacitor.events.DID_RUN, didRunHandler);
      flux.run(eventName, eventData);
      assert.ok(willRunHandler.called, 'WILL_RUN called');
      assert.ok(willRunHandler.calledWith(eventName, eventData), 'WILL_RUN called with expected args');
      assert.ok(didRunHandler.called, 'DID_RUN called');
      assert.ok(didRunHandler.calledWith(eventName, eventData), 'DID_RUN called with expected args');
      assert.notOk(invalidHandler.called, 'INVALID_RUN called');
    })
  });
});