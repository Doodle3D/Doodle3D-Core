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
    selectedPen: PropTypes.string.isRequired
  };

  componentDidMount() {
    const { container } = this.refs;

    container.addEventListener('dragover', event => event.preventDefault());
    container.addEventListener('drop', this.onDrop);
    window.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    const { container } = this.refs;
    container.removeEventListener('drop', this.onDrop);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onDrop = async event => {
    const { openSketch, addImage } = this.props;
    event.preventDefault();

    for (const file of event.dataTransfer.files) {
      const extentions = file.name.split('.').pop();

      switch (extentions.toUpperCase()) {
        case 'D3SKETCH':
        case 'JSON':
          const url = URL.createObjectURL(file);
          const data = await fetch(url).then(result => result.json());
          const sketchData = await JSONToSketchData(data);
          openSketch({ data: sketchData });
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

  render() {
    const { classes, undo, redo } = this.props;
    return (
      <div ref="container" className={classes.container}>
        <InlineIconsLoader />
        <div className={classes.appContainer}>
          <D2Panel />
          <div className={classes.vLine} />
          <D3Panel />
        </div>
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
