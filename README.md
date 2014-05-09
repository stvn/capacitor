capacitor
=========

Reactive event system - like MVC, but pluggable, powerful, and asynchronous.

Inspired by Facebook's talk ["Hacker Way: Rethinking Web App Development at Facebook"](https://www.youtube.com/watch?v=nYkdrAPrdcw&feature=youtu.be). Works well with [React](http://facebook.github.io/react/) but not tied to it.

# Example

```javascript
var flux = getFluxCapacitor();

flux.state({
  name: 'loginState',

  /*
   * accepts currents of form:
      {
        name: 'login',
        data: {
          email: 'someone@example.com',
          password: 'abcdefgh'
        }
      }
  */
  login: function() {
    return this
      .pipe(log()) // log all submitted form data
      .pipe(queueIfProcessing()) // queue any new events if already processing the event
      .pipe(httpPost('/login/action'))  // post the data to a url
      .pipe(ifif(function(current) { return current.data.success }, transition('homePage')))
      .pipe(render(LoginFailedPage))
  }
});

```


# Usage

```javascript
var Capacitor = require('capacitor');
var flux = new Capacitor();

// add a `log` capacitor: makes `this.log()` work within event handlers
flux.capacitor('log', function(data, next) {
  // TODO: what is the `this` context?
  // TODO: how would you implement `debounce()`?
  console.log(data);
  next(null, data);
});

// add a state
flux.state({
  name: 'hello',
  sampleEvent: function() {
    // uses the capacitor defined with`flux.capacitor('log')`
    return this.pipe(log());
  }
});

// emit an event into the system
flux.emit('sampleEvent', {
  name: 'Flux Capacitor'
});
```

