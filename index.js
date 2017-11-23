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

// add inital shapes
import * as CAL from 'cal';
store.dispatch(actions.addObject({
  type: 'STAR',
  fill: true,
  solid: false,
  star: { innerRadius: 10, outerRadius: 20, rays: 5 },
  transform: new CAL.Matrix({ x: -20, y: 0 })
}));
store.dispatch(actions.addObject({
  type: 'RECT',
  fill: true,
  rectSize: new CAL.Vector(20, 20),
  height: 40,
  transform: new CAL.Matrix({ x: -10, y: -10 })
}));

// render dom
import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import App from './src/components/App.js';
import sketcherReducer from './src/reducer/index.js';

render((
  <Provider store={store}>
    <App />
  </Provider>
), document.getElementById('app'));
