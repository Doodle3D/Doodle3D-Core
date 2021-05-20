import React from 'react';
import PropTypes from 'proptypes';
import injectSheet from 'react-jss';
import { connect } from 'react-redux';
import * as actions from '../actions/index.js';
import Logo from './Logo.js';
import D2Panel from './D2Panel.js';
import D3Panel from './D3Panel.js';
import SketcherToolbars from './SketcherToolbars.js';
import Button from './Button.js';
import vlineImageURL from '../../img/vline.png';
import btnUndoImageURL from '../../img/mainmenu/btnUndo.png';
import btnRedoImageURL from '../../img/mainmenu/btnRedo.png';
import InlineIconsLoader from './InlineIconsLoader.js';
import JSONToSketchData from '../shape/JSONToSketchData.js';
import keycode from 'keycode';
import bowser from 'bowser';
import * as d2Tools from '../constants/d2Tools.js';
import { isLoaded, load } from '../utils/loaded.js';
import { setConfig } from '@doodle3d/touch-events';

setConfig({ DRAG_THRESHOLD: 0 });

const styles = {
  container: {
    position: 'relative',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: '100%'
  },
  appContainer: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden'
  },
  vLine: {
    backgroundSize: '14px auto',
    backgroundImage: `url('${vlineImageURL}')`,
    width: '28px'
  },
  undoMenu: {
    display: 'flex',
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: '-68px'
  },
  undo: {
    cursor: 'pointer',
    backgroundSize: '68px auto',
    width: '68px',
    height: '58px',
    backgroundImage: `url('${btnUndoImageURL}')`
  },
  redo: {
    cursor: 'pointer',
    backgroundSize: '71px auto',
    width: '71px',
    height: '58px',
    backgroundImage: `url('${btnRedoImageURL}')`
  }
};

class App extends React.Component {
  static propTypes = {
    openSketch: PropTypes.func.isRequired,
    addImage: PropTypes.func.isRequired,
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    classes: PropTypes.objectOf(PropTypes.string),
    deleteSelection: PropTypes.func.isRequired,
    selectAll: PropTypes.func.isRequired,
    d2ChangeTool: PropTypes.func.isRequired,
    moveSelection: PropTypes.func.isRequired,
    selectedPen: PropTypes.string.isRequired,
    preventScroll: PropTypes.bool.isRequired
  };

  constructor(props) {
   super(props);

   this.container = React.createRef();
 }

  state = {
    loaded: isLoaded()
  };

  componentDidMount() {
    if (!this.state.loaded) load.then(() => this.setState({ loaded: true }));

    if (this.container.current) {
      this.container.current.addEventListener('dragover', this.dragOver);
      this.container.current.addEventListener('drop', this.onDrop);
      this.container.current.addEventListener('wheel', this.onWheel);
      window.addEventListener('keydown', this.onKeyDown);
    }
  }

  componentWillUnmount() {
    if (this.container.current) {

      this.container.current.addEventListener('dragover', this.dragOver);
      this.container.current.removeEventListener('drop', this.onDrop);
      this.container.current.addEventListener('wheel', this.onWheel);
      window.removeEventListener('keydown', this.onKeyDown);
    }
  }

  dragOver = event => {
    event.preventDefault();
  };

  onDrop = async event => {
    const { openSketch, addImage } = this.props;
    event.preventDefault();

    for (const file of event.dataTransfer.files) {
      const extentions = file.name.split('.').pop();

      switch (extentions.toUpperCase()) {
        case 'DOODLE3D':
        case 'D3SKETCH':
        case 'JSON':
          const url = URL.createObjectURL(file);
          const json = await fetch(url).then(result => result.json());
          const data = await JSONToSketchData(json);
          openSketch({ data });
          break;
        case 'JPG':
        case 'JPEG':
        case 'PNG':
        case 'GIF':
          await addImage(file);
          break;
        default:
          break;
      }
    }
  };

  onKeyDown = (event) => {
    const { undo, redo, deleteSelection, selectAll, d2ChangeTool, moveSelection, selectedPen } = this.props;
    const { metaKey, ctrlKey, shiftKey } = event;
    const key = keycode(event);
    const commandKey = bowser.mac ? metaKey : ctrlKey;

    const targetTag = event.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') return;

    switch (key) {
      case 'backspace':
      case 'delete':
        event.preventDefault();
        deleteSelection();
        break;

      case 'a':
        if (commandKey) selectAll();
        break;

      case 'z':
        if (commandKey) {
          if (shiftKey) {
            redo();
          } else {
            undo();
          }
        }
        break;

      case 's': {
        if (!commandKey) d2ChangeTool(d2Tools.TRANSFORM);
        break;
      }

      case 'e': {
        if (!commandKey) {
          event.preventDefault();
          d2ChangeTool(d2Tools.ERASER);
        }
        break;
      }

      case 'c': {
        if (!commandKey) d2ChangeTool(d2Tools.CIRCLE);
        break;
      }

      case 'l': {
        if (!commandKey) d2ChangeTool(d2Tools.POLYGON);
        break;
      }

      case 't': {
        if (!commandKey) d2ChangeTool(d2Tools.TEXT);
        break;
      }

      case 'b': {
        if (!commandKey) d2ChangeTool(selectedPen);
        break;
      }

      case 'left':
      case 'right':
      case 'up':
      case 'down': {
        const delta = shiftKey ? 10 : 1;
        const deltas = {
          left: { deltaX: -delta, deltaY: 0 },
          right: { deltaX: delta, deltaY: 0 },
          up: { deltaX: 0, deltaY: -delta },
          down: { deltaX: 0, deltaY: delta }
        };

        const { deltaX, deltaY } = deltas[key];
        moveSelection(deltaX, deltaY);
      }

      default:
        break;
    }
  }

  onWheel = (event) => {
    const { preventScroll } = this.props;
    if (preventScroll) event.preventDefault();
  };

  dragover = (event) => {
    event.preventDefault();
  };

  render() {
    const { classes, undo, redo } = this.props;
    const { loaded } = this.state;

    return (
      <div ref={this.container} className={classes.container}>
        <InlineIconsLoader />
        {loaded && <div className={classes.appContainer}>
          <D2Panel />
          <div className={classes.vLine} />
          <D3Panel />
        </div>}
        <Logo />
        <div className={classes.undoMenu}>
          <Button onSelect={undo} className={classes.undo} />
          <Button onSelect={redo} className={classes.redo} />
        </div>
        <SketcherToolbars />
      </div>
    );
  }
}

export default injectSheet(styles)(connect(state => ({
  preventScroll: state.sketcher.present.preventScroll,
  selectedPen: state.sketcher.present.menus['pen-tools'].selected
}), {
  undo: actions.undo.undo,
  redo: actions.undo.redo,
  openSketch: actions.openSketch,
  addImage: actions.addImage,
  deleteSelection: actions.deleteSelection,
  selectAll: actions.selectAll,
  d2ChangeTool: actions.d2ChangeTool,
  moveSelection: actions.moveSelection
})(App));
