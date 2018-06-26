import React from 'react';
import PropTypes from 'prop-types';
// import createDebug from 'debug';
// const debug = createDebug('d3d:button');

export default class Button extends React.Component {
  static propTypes = {
    onSelect: PropTypes.func,
    value: PropTypes.string,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    id: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
    svg: PropTypes.string,
    stopPropagation: PropTypes.bool
  };
  static defaultProps = {
    disabled: false,
    stopPropagation: false
  };
  onClick = (event) => {
    const { onSelect, value, disabled, stopPropagation } = this.props;
    if (disabled) return;
    if (onSelect) onSelect({ ...event, value });
    // we might want to stop the propagation of events to prevent
    // other things to respond to this click, like submenu's closing themselves
    if (stopPropagation) {
      event.nativeEvent.stopImmediatePropagation();
    }
  };
  render() {
    const { id, selected, disabled, className, children, svg } = this.props;
    let combinedClassName = 'button';
    if (selected) combinedClassName += ' selected';
    if (disabled) combinedClassName += ' disabled';
    if (className) combinedClassName += ` ${className}`;

    return (
      <div id={id} className={combinedClassName} onClick={this.onClick}>
        {svg && <svg>
          <use xlinkHref={svg}/>
        </svg>}
        {children}
      </div>
    );
  }
}
