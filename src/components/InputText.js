import React from 'react';
import injectSheet from 'react-jss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as actions from '../actions/index.js';
import * as CAL from 'cal';
import { TEXT_TOOL_FONT_SIZE } from '../constants/d2Constants.js';

document.createElement('canvas');

const styles = {
  textInputContainer: {
    position: 'absolute',
    display: 'flex'
  },
  textInput: {
    position: 'absolute',
    fontSize: `${TEXT_TOOL_FONT_SIZE}px`,
    background: 'transparent',
    border: 'none',
    color: 'black',
    textFillColor: 'transparent',
    outline: 'none'
  }
};

class InputText extends React.Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    classes: PropTypes.objectOf(PropTypes.string),
    changeText: PropTypes.func.isRequired,
    screenMatrix: PropTypes.instanceOf(CAL.Matrix).isRequired
  };

  onInputChange = () => {
    const shapeData = this.getShapeData();
    if (!shapeData) return;

    const { changeText } = this.props;
    const text = this.refs.text.value;

    changeText(text);
  };

  getShapeData = () => {
    const { state } = this.props;
    if (!state.d2.activeShape) return null;
    const shapeData = state.objectsById[state.d2.activeShape];
    if (shapeData.type !== 'TEXT') return null;
    return shapeData;
  }

  componentWillUpdate() {
    if (this.refs.text) this.refs.text.focus();
  }

  render() {
    const { classes, state, screenMatrix } = this.props;
    const shapeData = this.getShapeData();

    if (shapeData) {
      const { _matrix: m } = shapeData.transform
        .multiplyMatrix(state.d2.canvasMatrix)
        .multiplyMatrix(screenMatrix);

      return (
        <div
          className={classes.textInputContainer}
          style={{ transform: `matrix(${m[0]}, ${m[3]}, ${m[1]}, ${m[4]}, ${m[2]}, ${m[5]})` }}
        >
          <input
            className={classes.textInput}
            style={{ fontFamily: shapeData.text.family }}
            value={shapeData.text.text}
            ref="text"
            spellCheck="false"
            autoFocus
            onChange={this.onInputChange}
          />
        </div>
      );
    }
    return null;
  }
}

export default injectSheet(styles)(connect(state => ({
  state: state.sketcher.present
}), {
  changeText: actions.d2textInputChange
})(InputText));
