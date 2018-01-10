import React from 'react';
import PropTypes from 'prop-types';
import * as actions from '../actions/index.js';
import { connect } from 'react-redux';
import Menu from '../components/Menu.js';
import SubMenu from '../components/SubMenu.js';
import MenuItem from '../components/MenuItem.js';
import * as contextTools from '../constants/contextTools.js';
import * as d2Tools from '../constants/d2Tools.js';
import { createSelector } from 'reselect';
import injectSheet from 'react-jss';
import { FONT_TOOLS } from '../constants/contextTools.js';
import { FONT_FACE } from '../constants/general.js';
// TODO move this to jss instead of css
import '../../styles/styles.css';
// import createDebug from 'debug';
// const debug = createDebug('d3d:sketchertoolbars');

const TOOLBAR2D = 'toolbar2d';
const TOOLBAR3D = 'toolbar3d';
const CONTEXT = 'context';

const styles = {
  contextMenuContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    top: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none', /* enable clicking through object */
    '& *': {
      pointerEvents: 'visible' /* enable clicking in children */
    }
  }
};

class SketcherToolbars extends React.Component {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    toolbar2d: PropTypes.object, // TODO: specify further
    toolbar3d: PropTypes.object, // TODO: specify further
    context: PropTypes.object, // TODO: specify further
    classes: PropTypes.objectOf(PropTypes.string)
  };
  onSelect2D = ({ value }) => {
    const { dispatch } = this.props;
    dispatch(actions.d2ChangeTool(value));
  };
  onSelect3D = ({ value }) => {
    this.props.dispatch(actions.d3ChangeTool(value));
  };
  onSelectContext = ({ value }) => {
    switch (value) {
      case contextTools.DUPLICATE:
        this.props.dispatch(actions.duplicateSelection(value));
        break;

      case contextTools.DELETE:
        this.props.dispatch(actions.deleteSelection(value));
        break;

      case contextTools.UNION:
        this.props.dispatch(actions.union(value));
        break;

      case contextTools.INTERSECT:
        this.props.dispatch(actions.intersect(value));
        break;

      default:
        const { dispatch } = this.props;
        dispatch(actions.contextChangeTool(value));
        break;
    }
  };
  onOpen = ({ menuValue }) => {
    this.props.dispatch(actions.menuOpen(menuValue));
  };
  onClose = ({ menuValue }) => {
    this.props.dispatch(actions.menuClose(menuValue));
  };
  renderToolbar = (value, onSelect, data) => {
    return (
      <div id={`${value}-container`}>
        <Menu
          id={value}
          value={value}
          className="toolbar"
          onSelect={onSelect}
          onOpen={this.onOpen}
          onClose={this.onClose}
          selectedValue={data.selected}
        >
          {renderChildren(data.children)}
        </Menu>
      </div>
    );
  };
  render() {
    const { toolbar2d, toolbar3d, context, classes } = this.props;

    return (
      <div>
        <div id="sketcher-toolbars">
          {this.renderToolbar(TOOLBAR2D, this.onSelect2D, toolbar2d)}
          {this.renderToolbar(TOOLBAR3D, this.onSelect3D, toolbar3d)}
        </div>
        {context.children.length > 0 && <div className={classes.contextMenuContainer}>
          {this.renderToolbar(CONTEXT, this.onSelectContext, context)}
        </div>}
      </div>
    );
  }
}

function renderChildren(children) {
  const components = [];

  for (const child of children) {
    let component;

    if (child.children.length > 0) {
      component = (
        <SubMenu
          id={child.value}
          value={child.value}
          key={child.value}
          selectedValue={child.selected}
          open={child.open}
          svg={child.svg}
          selectOnOpen={child.selectOnOpen}
          toggleBehavior={child.toggleBehavior}
        >
          {renderChildren(child.children)}
        </SubMenu>
      );
    } else if (FONT_TOOLS.includes(child.value)) {
      component = (
        <MenuItem
          id={child.value}
          value={child.value}
          key={child.value}
          svg={child.svg}
          disabled={child.disabled}
        >
          <p style={{ fontFamily: FONT_FACE[child.value] }}>{FONT_FACE[child.value]}</p>
        </MenuItem>
      );
    } else {
      component = (
        <MenuItem
          id={child.value}
          value={child.value}
          key={child.value}
          svg={child.svg}
          disabled={child.disabled}
        />
      );
    }
    components.push(component);
  }
  return components;
}

function filterMenus(activeTool, numSelectedObjects, numFilledObjects, numSolidObjects, selectionIncludesText, menus) {
  const showUnion = activeTool === d2Tools.TRANSFORM && numFilledObjects && numSelectedObjects >= 2;
  const showIntersect = activeTool === d2Tools.TRANSFORM && numSelectedObjects >= 1;
  return {
    ...menus,
    children: menus.children.filter(({ value }) => {
      switch (value) {
        case contextTools.ADVANCED:
          return showUnion || showIntersect;

        case contextTools.UNION:
          return showUnion;

        case contextTools.INTERSECT:
          return showIntersect;

        case contextTools.DUPLICATE:
        case contextTools.DELETE:
          return numSelectedObjects > 0;

        case contextTools.FILL_TOGGLE:
          return numSelectedObjects > 0;

        case contextTools.ALIGN:
          return numSelectedObjects > 1;

        case contextTools.COLOR_PICKER:
          if (activeTool === d2Tools.ERASER) return false;
          if (activeTool === d2Tools.TRANSFORM && numSelectedObjects === 0) return false;
          return true;

        case contextTools.ERASER_SIZE:
          return activeTool === d2Tools.ERASER;

        case contextTools.BRUSH_SIZE:
          return activeTool === d2Tools.BRUSH;

        case contextTools.HOLE_TOGGLE:
          return numSelectedObjects > 0;

        case contextTools.FONT:
          return selectionIncludesText || activeTool === d2Tools.TEXT;

        default:
          return true;
      }
    }).map(child => {
      return filterMenus(activeTool, numSelectedObjects, numFilledObjects, numSolidObjects, selectionIncludesText, child);
    })
  };
}

function nestChildren(menus, target) {
  // const targetStr = JSON.stringify(target);
  const children = target.children.map(value => nestChildren(menus, menus[value]));
  const { selected } = target;
  return {
    svg: selected && children.find(({ value }) => value === selected).svg,
    ...target,
    selected,
    children: children.filter(({ hide }) => !hide)
  };
}

const getMenus = createSelector([
  state => state.sketcher.present.menus,
  state => state.sketcher.present.d2.tool,
  state => state.sketcher.present.selection.objects.length,
  state => state.sketcher.present.selection.objects.filter(({ id }) => {
    return state.sketcher.present.objectsById[id].fill;
  }).length,
  state => state.sketcher.present.selection.objects.filter(({ id }) => {
    return state.sketcher.present.objectsById[id].solid;
  }).length,
  state => state.sketcher.present.selection.objects.some(({ id }) => {
    return state.sketcher.present.objectsById[id].type === 'TEXT';
  })
], (menus, ...args) => ({
  toolbar2d: filterMenus(...args, nestChildren(menus, menus[TOOLBAR2D])),
  toolbar3d: filterMenus(...args, nestChildren(menus, menus[TOOLBAR3D])),
  context: filterMenus(...args, nestChildren(menus, menus[CONTEXT]))
}));

export default injectSheet(styles)(connect(getMenus)(SketcherToolbars));
