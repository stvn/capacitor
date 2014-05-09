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

  describe('it should have event emitter methods', function() {
    it('should have on()', function() {
      assert.doesNotThrow(function() {
        flux.on('event', function(){})
      });
    });

    it('should have off()', function() {
      assert.doesNotThrow(function() {
        flux.removeListener('event', function(){})
      });
    });
  });
});