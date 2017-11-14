import React from 'react';
import PropTypes from 'proptypes';
import injectSheet from 'react-jss';
import { connect } from 'react-redux';
import * as actions from '../actions';
import Logo from './Logo.js';
import D2Panel from './D2Panel.js';
import D3Panel from './D3Panel.js';
import SketcherToolbars from './SketcherToolbars.js';
import vlineImageURL from 'img/vline.png';
import btnUndoImageURL from 'img/mainmenu/btnUndo.png';
import btnRedoImageURL from 'img/mainmenu/btnRedo.png';

const styles = {
  container: {
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
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    classes: PropTypes.objectOf(PropTypes.string)
  };

  render() {
    const { classes, undo, redo } = this.props;

    return (
      <div className={classes.container}>
        <div className={classes.appContainer}>
          <D2Panel />
          <div className={classes.vLine} />
          <D3Panel />
        </div>
        <Logo />
        <SketcherToolbars />
        <div className={classes.undoMenu}>
          <div type="button" onTouchTap={undo} className={classes.undo} />
          <div type="button" onTouchTap={redo} className={classes.redo} />
        </div>
      </div>
    );
  }
}


export default injectSheet(styles)(connect(null, {
  undo: actions.undo.undo,
  redo: actions.undo.redo
})(App));
