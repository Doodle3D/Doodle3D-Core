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

// add actions to window
import actionWrapper from 'redux-action-wrapper';
import * as actions from './src/actions/index.js';
window.actions = actionWrapper(actions, store.dispatch);
import { saveAs as saveAsLib } from 'file-saver';

// download file
import { createFile } from './src/utils/exportUtils.js';
import sketchDataToJSON from './src/shape/sketchDataToJSON.js';
import { JSONToBlob } from './src/utils/binaryUtils.js';

// usage: downloadStl({lineWidth:20})
window.downloadStl = (options) => {
  store.dispatch(async (dispatch, getState) => {
    const state = getState();
    const blob = await createFile(state.sketcher.present, 'stl-blob', options);
    saveAsLib(blob, 'doodle.stl');
  });
};

window.downloadSketch = () => {
  store.dispatch((dispatch, getState) => {
    const state = getState();
    const json = sketchDataToJSON(state.sketcher.present);
    const blob = JSONToBlob(json);
    saveAsLib(blob, 'doodle.doodle3d');
  });
};

// import keycode from 'keycode';
// window.addEventListener('keydown', (event) => {
//   // downloadSketch
//   const key = keycode(event);
//   if (key === 's') window.downloadSketch();
// });


// add model to store
import modelData from './models/circle_error.d3sketch';
import JSONToSketchData from './src/shape/JSONToSketchData.js';
JSONToSketchData(JSON.parse(modelData)).then(data => {
  store.dispatch(actions.openSketch({ data }));
});

// default css
import jss from 'jss';
import preset from 'jss-preset-default';
import normalize from 'normalize-jss';
import abril from './fonts/abril-fatface-v12-latin-regular.woff';
import bellefair from './fonts/bellefair-v6-latin-regular.woff';
import fascinate from './fonts/fascinate-v11-latin-regular.woff';
import joti from './fonts/joti-one-v11-latin-regular.woff';
import lobster from './fonts/lobster-v23-latin-regular.woff';
import oswald from './fonts/oswald-v36-latin-regular.woff';
import play from './fonts/play-v12-latin-regular.woff';
import ranga from './fonts/ranga-v8-latin-regular.woff';

const fontFaces = [
  { url: abril, family: 'Abril Fatface' }, 
  { url: bellefair, family: 'Bellefair' },
  { url: fascinate, family: 'Fascinate' },
  { url: joti, family: 'Joti One' },
  { url: lobster, family: 'Lobster' },
  { url: oswald, family: 'Oswald' },
  { url: play, family: 'Play' },
  { url: ranga, family: 'Ranga' },
];

jss.setup(preset());
jss.createStyleSheet(normalize).attach();
jss.createStyleSheet({
    '@font-face': fontFaces.map(({ url, family }) => ({
        'font-family': family, 
        'src': `url("${url}") format("woff")`
    })),
    '@global': {
    '*': { margin: 0, padding: 0 },
    '#app, body, html': { height: '100%', fontFamily: 'sans-serif' },
    body: { overflow: 'auto' },
    html: { overflow: 'hidden' }
  }
}).attach();

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
