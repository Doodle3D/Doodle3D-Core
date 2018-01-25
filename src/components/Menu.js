import React from 'react';
import PropTypes from 'prop-types';
// import createDebug from 'debug';
// const debug = createDebug('d3d:menu');

class Menu extends React.Component {
  static propTypes = {
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    selectedValue: PropTypes.string,
    value: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node,
    id: PropTypes.string
  };
  onSelect = (event) => {
    const { onSelect, value } = this.props;
    // add menu value when it's not already defined by a submenu
    const { menuValue = value } = event;
    if (onSelect) onSelect({ ...event, menuValue });
  };
  render() {
    const { className = '', id, selectedValue, onOpen, onClose, children } = this.props;
    return (
      <ul id={id} className={`menu ${className}`}>
        {React.Children.map(children, (child) => {
          return React.cloneElement(child, {
            onSelect: this.onSelect,
            onOpen,
            onClose,
            selected: (child.props.value === selectedValue)
          });
        })}
      </ul>
    );
  }
}

export default Menu;
