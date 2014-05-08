var assert = require('chai').assert,
    sinon = require('sinon'),
    through = require('through2'),
    Capacitor = require('../'),
    Current = require('../src/current'),
    CapacitorApiError = require('../src/capacitor_api_error');

describe('Capacitor core API', function() {
  var flux, state, logger, log;

  beforeEach(function() {
    flux = new Capacitor();
    logger = sinon.spy();
    log = function() {
      return through.obj(function(current, enc, callback) {
        logger(current.name);
        logger(current.data);
        this.push(current);
        return callback();
      });
    };
    state = {
      name: 'logger',
      log: function() {
        return this.pipe(log());
      }
    };
    flux.state(state);
    flux.initialize(state.name);
  });

  it('should handle an event that logs', function() {
    flux.run('log', 'message');
    assert.ok(logger.called, 'should call state.log()');
    assert.equal(logger.args[0][0], 'log');
    assert.equal(logger.args[1][0], 'message');
  });
});