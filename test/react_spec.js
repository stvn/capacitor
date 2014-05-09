var assert = require('chai').assert,
    sinon = require('sinon'),
    React = require('react'),
    Capacitor = require('../'),
    CapacitorApiError = require('../src/capacitor_api_error');

var TestComponent = React.createClass({
  displayName: 'TestComponent',
  render: function() {
    return React.DOM.div({id: 'hello'}, this.props.message);
  }
});

describe('Capacitor.react transform', function() {
  var flux, state, component;

  beforeEach(function() {
    flux = new Capacitor();
    state = {
      name: 'test',
      testEvent: function() {
        return this.pipe(Capacitor.react(TestComponent));
      }
    }
    flux.state(state);
    flux.initialize(state.name);

    $('body').append('<div id="react"></div>');
    Capacitor.react.setRoot($('#react').get(0));
  });

  it('should render components based on input current', function(done) {
    var message = 'hello world';
    flux.run('testEvent', {message: message});
    flux.on(Capacitor.events.ERROR, done);
    flux.on(Capacitor.events.DID_RUN, function() {
      done();
    });
  });
});