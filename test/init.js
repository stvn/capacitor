var jsdom = require('jsdom'),
    jquery = require('jquery'),
    isNode = typeof window === 'undefined',
    React,
    helpers;

function setupDom() {
  global.document = jsdom.jsdom();
  global.window = document.createWindow();
  global.navigator = window.navigator;
  global.$ = jquery(window);
};

function teardownDom() {
  delete global.document;
  delete global.window;
  delete global.navigator;
  delete global.$;
};

// configure node environment so tests can run
if (isNode) {
  setupDom();

  // clean virtual dom for every test
  beforeEach(setupDom);
  afterEach(teardownDom);
}

// make helpers available globally for convenience
global.helpers = {
  react: require('./react_helper')
};
