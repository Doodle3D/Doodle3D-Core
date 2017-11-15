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

// render dom
import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import App from './src/components/App.js';
import InlineIconsLoader from './src/components/InlineIconsLoader.js';
import sketcherReducer from './src/reducer/index.js';

render((
  <Provider store={store}>
    <span style={{ height: '100%' }}>
      <InlineIconsLoader />
      <App />
    </span>
  </Provider>
), document.getElementById('app'));
