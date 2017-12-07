// import polyfill
import 'babel-polyfill';

// inject tap event plugin
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

// create store
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { createLogger } from 'redux-logger';
import sketcherReducer from './src/reducer/index.js';
const reducer = combineReducers({ sketcher: sketcherReducer });
const enhancer = compose(applyMiddleware(thunkMiddleware, promiseMiddleware(), createLogger({ collapsed: true })));
const store = createStore(reducer, enhancer);

// prepare html (SHOULDN'T BE DONE LIKE THIS)
document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.height = '100%';
document.documentElement.style.height = '100%';
document.documentElement.style.overflow = 'hidden';
document.getElementById('app').style.height = '100%';

import actionWrapper from 'redux-action-wrapper';
import * as actions from './src/actions/index.js';
window.actions = actionWrapper(actions, store.dispatch);

import modelData from './models/noodlebot.d3sketch';
import JSONToSketchData from './src/shape/JSONToSketchData.js';
(async () => {
  const data = await JSONToSketchData(JSON.parse(modelData));
  store.dispatch(actions.openSketch({ data }));
})();

// render dom
import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import App from './src/components/App.js';

async function init() {
  if (process.env.TARGET === 'app') {
    await new Promise(resolve => document.addEventListener('deviceready', resolve, false));
  }

  render((
    <Provider store={store}>
      <App />
    </Provider>
  ), document.getElementById('app'));
}
init();
