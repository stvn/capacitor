capacitor
=========

Reactive event system - like MVC, but pluggable, powerful, and asynchronous.

Inspired by Facebook's talk ["Hacker Way: Rethinking Web App Development at Facebook"](https://www.youtube.com/watch?v=nYkdrAPrdcw&feature=youtu.be). Works well with [React](http://facebook.github.io/react/) but not tied to it.

# Example

```javascript
var flux = getFluxCapacitor();

flux.state({
  name: 'loginState',
  login: function() {
    return this
      .log() // log all submitted form data
      .queueIfProcessing() // queue any new events if already processing the event
      .post('/login/action')  // post the data to a url
      .map(function(response) { // convert the data to an output
        if (response.success) {
          this.transition('homePage') // if login successful, data converts to a transition
        } else {
          return this.render(LoginFailedPage, { // if login failed, data converts to rendering a failure message
            message: 'Please check your email/password.'
          });
        }
      })
  }
})

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
  sampleEvent: function(data) {

    // uses the capacitor defined with`flux.capacitor('log')`
    return this.log(data);
  }
});

// emit an event into the system
flux.emit('sampleEvent', {
  name: 'Flux Capacitor'
});
```

