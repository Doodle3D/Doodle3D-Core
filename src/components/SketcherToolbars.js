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
}

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

const style = document.createElement('style');
style.innerHTML = `
.button {
	cursor: pointer;
}
#toolbar3d-container {
	position: absolute;
	right: 0;
	bottom: 0;
	width: 50%;
}
#toolbar3d {
	background-image: url('../img/toolbar3d/toolbar3d.png');
	background-size: 493px auto;
	background-repeat: no-repeat;
	background-position: center -4px;
	height: 77px;

	width: 493px;
}

#toolbar3d>.menuitem>.button,
#toolbar3d>.submenu>.button  {
	/* positioning buttons with padding to increase hit area */
  padding: 10px 52px 0 52px;
}

/* 3D toolbar tools */
#toolbar3d #height-tool {
	background-image: url('../img/toolbar3d/btnExtrude.png');
	background-size: 21px auto;
	width: 21px;
	height: 42px;
}
#toolbar3d #sculpt-tool {
	background-image: url('../img/toolbar3d/btnSculpt.png');
	background-size: 39px auto;
	width: 39px;
	height: 42px;
}
#toolbar3d #twist-tool {
	background-image: url('../img/toolbar3d/btnTwist.png');
	background-size: 40px auto;
	width: 40px;
	height: 42px;
}
#toolbar3d #cut-tool {
	background-image: url('../img/toolbar3d/btnCut.png');
	background-size: 43px auto;
	width: 43px;
	height: 41px;
}
#toolbar3d #stamp-tool {
	background-image: url('../img/toolbar3d/btnStamp.png');
	background-size: 43px auto;
	width: 40px;
	height: 42px;
}

/* 3D toolbar tools SELECTED */
#toolbar3d #height-tool.selected {
	background-image: url('../img/toolbar3d/btnExtrudeSelect.png');
}
#toolbar3d #sculpt-tool.selected {
	background-image: url('../img/toolbar3d/btnSculptSelect.png');
}
#toolbar3d #twist-tool.selected {
	background-image: url('../img/toolbar3d/btnTwistSelect.png');
}
#toolbar3d #cut-tool.selected {
	background-image: url('../img/toolbar3d/btnCutSelect.png');
}
#toolbar3d #stamp-tool.selected {
	background-image: url('../img/toolbar3d/btnStampSelect.png');
}

@media (max-width: 900px) {
	#toolbar3d {
		background-image: none;
		background-color: white;
		height: 60px;
	}

	#toolbar3d>.menuitem>.button,
	#toolbar3d>.submenu>.button  {
		padding: 10px 25px 0 25px;
	}
}

@media (max-width: 720px) {
	#toolbar3d>.menuitem>.button,
	#toolbar3d>.submenu>.button  {
	  padding: 10px 25px 0 25px;
	}
}
@media (max-width: 620px) {
	#toolbar3d>.menuitem>.button,
	#toolbar3d>.submenu>.button  {
	  padding: 10px 10px 0 10px;
	}
}
#context {
	background: #fff;
	border: 4px solid #000;
	border-radius: 1rem;
}
#context .submenu {
	position: relative;
}
#context .menu {
	z-index: 1;
	position: absolute;
	top: 50px;
	/* Using transform to center submenu
	   Needed because some browser don't support flex-box's changed behaivior:
		 https://developers.google.com/web/updates/2016/06/absolute-positioned-children
	   Can't use the bottom toolbar's positioning system
	   because this submenu needs to be in line with the flex direction */
	left: 50%;
	transform: translateX(-50%);
}
#context .button {
	padding: 0.5rem 0.5rem 0.5rem 0.5rem;

	background-repeat: no-repeat;
	background-position: center;
}
#context #duplicate-tool {
	background-image: url('../img/contextmenu/btnDuplicate.png');
	background-size: 33px auto;
	height: 41px;
}
#context #delete-tool {
	background-image: url('../img/contextmenu/btnDelete.png');
	background-size: 33px auto;
	height: 41px;
}
#context #union-tool {
	background-image: url('../img/contextmenu/btnGroup.png');
	background-size: 33px auto;
	height: 41px;
	width: 30px;
}
#context #intersect-tool {
	background-image: url('../img/contextmenu/btnCutOut.png');
	background-size: 33px auto;
	height: 41px;
	width: 30px;
}
#union-tool-menu, #intersect-tool-menu {
	background-image: url('../img/contextmenu/btnMore.png');
	background-size: 33px auto;
	height: 41px;
	width: 30px;
}
#brush-size-small, #brush-size-small-menu,
#eraser-size-small, #eraser-size-small-menu {
	background-image: url('../img/contextmenu/btnOutline1.png');
	background-size: 33px auto;
	width: 33px;
	height: 41px;
}
#brush-size-medium, #brush-size-medium-menu,
#eraser-size-medium, #eraser-size-medium-menu {
	background-image: url('../img/contextmenu/btnOutline2.png');
	background-size: 33px auto;
	width: 33px;
	height: 41px;
}
#brush-size-large, #brush-size-large-menu,
#eraser-size-large, #eraser-size-large-menu {
	background-image: url('../img/contextmenu/btnOutline3.png');
	background-size: 33px auto;
	width: 33px;
	height: 41px;
}
#fill-toggle-fill, #fill-toggle-fill-menu {
	background-image: url('../img/contextmenu/btnShapeFill.png');
	background-size: 33px auto;
	width: 33px;
	height: 41px;
}
#fill-toggle-outline, #fill-toggle-outline-menu {
	background-image: url('../img/contextmenu/btnShapeOutline.png');
	background-size: 33px auto;
	width: 33px;
	height: 41px;
}
#align-right-menu, #align-horizontal-menu, #align-left-menu,
#align-top-menu, #align-vertical-menu, #align-bottom-menu {
	background-image: url('../img/contextmenu/btnAlignHorizontal.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#align-left {
	background-image: url('../img/contextmenu/btnAlignLeft.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#align-horizontal {
	background-image: url('../img/contextmenu/btnAlignHorizontal.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#align-right {
	background-image: url('../img/contextmenu/btnAlignRight.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#align-top {
	background-image: url('../img/contextmenu/btnAlignTop.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#align-vertical {
	background-image: url('../img/contextmenu/btnAlignVertical.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#align-bottom {
	background-image: url('../img/contextmenu/btnAlignBottom.png');
	background-size: 40px auto;
	width: 40px;
	height: 40px;
}
#color-picker-tool .button {
	margin: 0.5rem 0.5rem 0.5rem 0.5rem;
	padding: 0;
	width: 33px;
	height: 41px;
	overflow: hidden;
}

#color-picker-tool .menu .button {
	width: 30px;
	height: 30px;
}

#color-picker-tool .menu {
	width: 185px;
	flex-wrap: wrap;
}

#align-tool .menu {
	width: 170px;
	flex-wrap: wrap;
}

#color-light-blue, #color-light-blue-menu {
	fill: #c8e4f7;
}
#color-light-green, #color-light-green-menu {
	fill: #cbe6c0;
}
#color-light-pink, #color-light-pink-menu {
	fill: #f8c4d8;
}
#color-light-yellow, #color-light-yellow-menu {
	fill: #f5f5c0;
}
#color-blue, #color-blue-menu {
	fill: #92c8ef;
}
#color-green, #color-green-menu {
	fill: #99cc81;
}
#color-pink, #color-pink-menu {
	fill: #f28bb1;
}
#color-yellow, #color-yellow-menu {
	fill: #ebea7f;
}
#color-dark-blue, #color-dark-blue-menu {
	fill: #50a8e4;
}
#color-dark-green, #color-dark-green-menu {
	fill: #5aae31;
}
#color-dark-pink, #color-dark-pink-menu {
	fill: #e94481;
}
#color-dark-yellow, #color-dark-yellow-menu {
	fill: #dfde24;
}
/* menu's */
.menu {
	list-style: none;
	margin: 0;
	padding: 0;
	border: none;
}

.menu .menuitem {
	display: block;
}

.menu .submenu {
	display: flex;
	/* put menu above button */
	flex-direction: column-reverse;
	/* center menu above button */
	align-items: center;
	/* overriding width making the submenu's menu doesn't take up space */
	width: 64px;
}

.menu .submenu .menu {
	background-color: #fff;
	border: 4px solid #000;
	border-radius: 1rem;
	display: none;
	margin: 0 0 -0.5rem 0;
}
.menu .submenu.open .menu {
	display: flex;
}
.menu .submenu .button {
	padding: 0.2rem 0.6rem 0.4rem 0.6rem;
}
/* Toolbars */
.toolbar .button {
	background-repeat: no-repeat;
	background-position: center;
}
.toolbar .button.disabled {
	opacity: 0.5;
	cursor: auto;
}

#sketcher-toolbars .toolbar {
	max-width: 100%;
	margin-left: auto;
	margin-right: auto;

	display: flex;
	justify-content: center;
	align-items: flex-end;
}
@media (max-width: 930px) {
	.menu .submenu {
		width: 54px;
	}
}
@media (max-width: 790px) {
	.menu .submenu {
		width: 40px;
	}
}
/* 2D toolbar */
#toolbar2d-container {
	position: absolute;
	left: 0;
	bottom: 0;
	width: 50%;
}

#toolbar2d {
	background-image: url('../img/toolbar2d/toolbar2d.png');
	background-size: 493px auto;
	background-repeat: no-repeat;
	background-position: center;
	height: 77px;
	width: 493px;
}

#toolbar2d>.menuitem>.button,
#toolbar2d>.submenu>.button  {
	/* positioning buttons with padding to increase hit area */
	padding: 25px 15px 0 15px;
}

#toolbar2d #shape-tools .menu{
	width: 160px;
	flex-wrap: wrap;
}
#toolbar2d #bucket-tools .menu{
	width: 220px;
	flex-wrap: wrap;
}
/*#toolbar2d #pen-tools {
	align-items: flex-start;
}*/
#toolbar2d #pen-tools .menu {
	margin: 0 0 -0.7rem 0;
}

/* 2D toolbar tools */
#toolbar2d #transform-tool {
	background-image: url('../img/toolbar2d/btnSelect.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #freehand-tool-menu, #toolbar2d #freehand-tool {
	background-image: url('../img/toolbar2d/btnDraw.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #polygon-tool-menu, #toolbar2d #polygon-tool {
	background-image: url('../img/toolbar2d/btnPolygon.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #brush-tool-menu, #toolbar2d #brush-tool {
	background-image: url('../img/toolbar2d/btnBrush.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #eraser-tool {
	background-image: url('../img/toolbar2d/btnEraser.png');
	background-size: 45px auto;
	width: 44px;
	height: 45px;
}
#toolbar2d #text-tool {
	background-image: url('../img/toolbar2d/btnText.png');
	background-size: 35px auto;
	width: 37px;
	height: 35px;
}
#toolbar2d #photo-guide-tool {
	background-size: 45px auto;
	width: 50px;
	height: 34px;
	background-image: url('../img/toolbar2d/btnPhoto.png');
}
/* 2D toolbar shape submenu tools */
#toolbar2d #star-tool-menu, #toolbar2d #star-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeStar.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #circle-tool-menu, #toolbar2d #circle-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeCircle.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #poly-point-tool-menu, #toolbar2d #poly-point-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeHex.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #heart-tool-menu, #toolbar2d #heart-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeHeart.png');
	background-size: 42px auto;
	width: 42px;
	height: 41px;
}
#toolbar2d #circle-segment-tool-menu, #toolbar2d #circle-segment-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeCircleSegment.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #rect-tool-menu, #toolbar2d #rect-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeRect.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #triangle-tool-menu, #toolbar2d #triangle-tool {
	background-image: url('../img/toolbar2d/shapes/btnShapeTriangle.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}
#toolbar2d #bucket-tool-menu, #toolbar2d #bucket-tool {
	background-image: url('../img/toolbar2d/btnBucket.png');
	background-size: 34px auto;
	width: 34px;
	height: 41px;
}

/* 2D toolbar tools SELECTED */
#toolbar2d #transform-tool.selected {
	background-image: url('../img/toolbar2d/btnSelectSelect.png');
}
#toolbar2d #freehand-tool-menu.selected, #toolbar2d #freehand-tool.selected {
	background-image: url('../img/toolbar2d/btnDrawSelect.png');
}
#toolbar2d #polygon-tool-menu.selected, #toolbar2d #polygon-tool.selected {
	background-image: url('../img/toolbar2d/btnPolygonSelect.png');
}
#toolbar2d #brush-tool-menu.selected, #toolbar2d #brush-tool.selected {
	background-image: url('../img/toolbar2d/btnBrushSelect.png');
}
#toolbar2d #eraser-tool.selected {
	background-image: url('../img/toolbar2d/btnEraserSelect.png');
}
#toolbar2d #text-tool.selected {
	background-image: url('../img/toolbar2d/btnTextSelect.png');
}
#toolbar2d #photo-guide-tool.selected {
	background-image: url('../img/toolbar2d/btnPhotoSelect.png');
}
/* 2D toolbar shape submenu tools SELECTED */
#toolbar2d #star-tool-menu.selected, #toolbar2d #star-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeStarSelect.png');
}
#toolbar2d #circle-tool-menu.selected, #toolbar2d #circle-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeCircleSelect.png');
}
#toolbar2d #circle-segment-tool-menu.selected, #toolbar2d #circle-segment-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeCircleSegmentSelect.png');
}
#toolbar2d #rect-tool-menu.selected, #toolbar2d #rect-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeRectSelect.png');
}
#toolbar2d #triangle-tool-menu.selected, #toolbar2d #triangle-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeTriangleSelect.png');
}
#toolbar2d #poly-point-tool-menu.selected, #toolbar2d #poly-point-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeHexSelect.png');
}
#toolbar2d #heart-tool-menu.selected, #toolbar2d #heart-tool.selected {
	background-image: url('../img/toolbar2d/shapes/btnShapeHeartSelect.png');
}
#toolbar2d #bucket-tool-menu.selected, #toolbar2d #bucket-tool.selected {
	background-image: url('../img/toolbar2d/btnBucketSelect.png');
}

@media (max-width: 930px) {
	#toolbar2d>.menuitem>.button,
	#toolbar2d>.submenu>.button  {
		padding: 25px 10px 0 10px;
	}
}
@media (max-width: 900px) {
	#toolbar2d {
		background-image: none;
		background-color: white;
		height: 60px;
	}

	#toolbar2d>.menuitem>.button,
	#toolbar2d>.submenu>.button  {
		padding: 25px 0px 0 0px;
	}
}

/*#submenu-shape {
	display: none;
	position: absolute;
	bottom: 55px;
	width: 181px;
	height: 200px;
	padding-left: 18px;
	padding-top: 25px;
	/*border: 1px solid red;*/
	/*background-color: white;
	background-image: url('../img/toolbar2d/shapeMenuBackground.png');
	background-repeat: no-repeat;
	background-position: center;
	background-size: 181px auto;*/
/*}*/

/*#submenu-shape div {
	display: inline-block;
}

#submenu-shape img {
	width: 45px;
	height: 45px;
}

#btnShapeMenuMini {
	position: absolute;
	margin-left: -310px;
	display: inline-block;
}

#btnShapeMenuMini img {
	width: 67px;
	height: 33px;
}

#submenu-shape #skewed-rect-tool {
	display: none;
}*/
`;
document.body.append(style);

export default injectSheet(styles)(connect(getMenus)(SketcherToolbars));
