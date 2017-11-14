import React from 'react';
import PropTypes from 'prop-types';
import * as actions from '../actions/index.js';
import { connect } from 'react-redux';
import * as contextTools from '../constants/contextTools';
import * as d2Tools from '../constants/d2Tools';
import { createSelector } from 'reselect';
import Menu from 'src/js/components/Menu.js';
import SubMenu from 'src/js/components/SubMenu.js';
import MenuItem from 'src/js/components/MenuItem.js';
// import createDebug from 'debug';
// const debug = createDebug('d3d:sketchertoolbars');

const TOOLBAR2D = 'toolbar2d';
const TOOLBAR3D = 'toolbar3d';
const CONTEXT = 'context';

class SketcherToolbars extends React.Component {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    toolbar2d: PropTypes.object, // TODO: specify further
    toolbar3d: PropTypes.object, // TODO: specify further
    context: PropTypes.object // TODO: specify further
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
    const { toolbar2d, toolbar3d, context } = this.props;

    return (
      <div>
        <div id="sketcher-toolbars">
          {this.renderToolbar(TOOLBAR2D, this.onSelect2D, toolbar2d)}
          {this.renderToolbar(TOOLBAR3D, this.onSelect3D, toolbar3d)}
        </div>
        {context.children.length > 0 && <div className="centerer">
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

function filterMenus(numSelectedObjects, allObjectsAreFilled, activeTool, menus) {
  const showUnion = activeTool === d2Tools.TRANSFORM && allObjectsAreFilled && numSelectedObjects >= 2;
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

        default:
          return true;
      }
    }).map(child => {
      return filterMenus(numSelectedObjects, allObjectsAreFilled, activeTool, child);
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
  state => state.sketcher.present.selection.objects.length,
  state => state.sketcher.present.selection.objects.every(({ id }) => state.sketcher.present.objectsById[id].fill),
  state => state.sketcher.present.d2.tool
], (menus, numSelectedObjects, allObjectsAreFilled, activeTool) => ({
  toolbar2d: filterMenus(numSelectedObjects, allObjectsAreFilled, activeTool, nestChildren(menus, menus[TOOLBAR2D])),
  toolbar3d: filterMenus(numSelectedObjects, allObjectsAreFilled, activeTool, nestChildren(menus, menus[TOOLBAR3D])),
  context: filterMenus(numSelectedObjects, allObjectsAreFilled, activeTool, nestChildren(menus, menus[CONTEXT]))
}));

export default connect(getMenus)(SketcherToolbars);
