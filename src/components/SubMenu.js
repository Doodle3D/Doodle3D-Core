import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button.js';
import Menu from './Menu.js';
import { connect } from 'react-redux';
import { hexToStyle } from '../utils/colorUtils.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:ui:submenu');

class SubMenu extends React.Component {
  constructor(props) {
    super(props);
    this.li = React.createRef();
  }

  static propTypes = {
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    selected: PropTypes.bool,
    open: PropTypes.bool,
    selectedValue: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.string,
    svg: PropTypes.string,
    children: PropTypes.node,
    selectOnOpen: PropTypes.bool,
    toggleBehavior: PropTypes.bool,
    color: PropTypes.number,
    solid: PropTypes.bool
  };
  componentWillMount = () => {
    // Listeners to close the submenu when anywhere else is clicked
    document.addEventListener('click', this.onDocumentClick);
    // NOTE for some reason I couldn't pick up a background click from our 2D/3D panel.
    document.addEventListener('touchstart', this.onDocumentTouch);
  };
  componentWillUnmount = () => {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('touchstart', this.onDocumentTouch);
  };
  onSelect = (event) => {
    const { onSelect, onOpen, selectOnOpen, toggleBehavior, children } = this.props;

    let { value } = event;
    if (toggleBehavior) {
      const index = (children.findIndex(({ key }) => key === value) + 1) % children.length;
      value = children[index].key;
    }
    if (onSelect && selectOnOpen) onSelect({ value });

    // add menu value when it's not already defined by a submenu
    const { menuValue = this.props.value } = event;
    if (onOpen && !toggleBehavior) onOpen({ menuValue });
  };
  onSubSelect = (event) => {
    const { onSelect, onClose, value } = this.props;
    if (onSelect) onSelect(event);
    if (onClose) onClose({ menuValue: value });
  };
  onDocumentTouch = (event) => {
    document.removeEventListener('click', this.onDocumentClick);
    this.onDocumentClick(event);
  };
  onDocumentClick = (event) => {
    const { open, onClose, value } = this.props;
    if (open && onClose) {
      // was click on this submenu?
      const onSubmenu = this.li.current.contains(event.target);
      // debug(`onDocumentClick ${event.type} ${onSubmenu ? 'onSubmenu' : ''}`);
      if (!onSubmenu) onClose({ menuValue: value });
    }
  };
  render() {
    const {
      id, value, selected, open, selectedValue, children, svg, toggleBehavior, color, solid
    } = this.props;

    const style = {};
    if (id === 'color-picker-tool') {
      style.fill = solid ? hexToStyle(color) : 'url(#holepattern)';
    }

    let className = 'submenu';
    if (open) className += ' open';
    return (
      <li id={id} className={className} ref={this.li} style={style}>
        <Button
          id={`${selectedValue}-menu`}
          value={selectedValue}
          selected={selected}
          onSelect={this.onSelect}
          svg={svg}
        />
        {!toggleBehavior && <Menu
          value={value}
          onSelect={this.onSubSelect}
          selectedValue={selectedValue}
        >
          {children}
        </Menu>
        }
      </li>
    );
  }
}

export default connect(state => ({
  color: state.sketcher.present.context.color,
  solid: state.sketcher.present.context.solid
}))(SubMenu);
