import update from 'react-addons-update';
import * as actions from '../../../actions/index.js';
import createDebug from 'debug';
import { removeObject, addObjectActive2D, setActive2D } from '../../../reducer/objectReducers.js';
import { SNAPPING_DISTANCE, LINE_WIDTH } from '../../../constants/d2Constants.js';
import { SHAPE_TYPE_PROPERTIES } from '../../../constants/shapeTypeProperties.js';
import { getSnappingPoints } from '../../../utils/objectSelectors.js';
import { fitPath, segmentBezierPath } from '../../../utils/curveUtils.js';
import * as tools from '../../../constants/d2Tools.js';
const debug = createDebug('d3d:reducer:pen');

const LINE_DIAMETER = LINE_WIDTH / 2.0;
const FREE_HAND = 'FREE_HAND';
const POLYGON = 'POLYGON';
const BRUSH = 'BRUSH';

export default function penReducer(state, action) {
  if (action.log !== false && action.type) debug(action.type);
  const screenPosition = action.position;

  const activeShape = state.d2.activeShape;
  const activeTool = state.d2.tool;

  let screenMatrixZoom;
  let screenMatrixZoomInverse;
  if (action.screenMatrixZoom) {
    screenMatrixZoom = action.screenMatrixZoom;
    screenMatrixZoomInverse = action.screenMatrixZoom.inverseMatrix();
  }

  switch (action.type) {
    case actions.D2_DRAG_START: {
      const preDrags = action.preDrags.map((preDrag) => preDrag.applyMatrix(screenMatrixZoomInverse));

      switch (activeTool) {
        case tools.POLYGON: {
          return addObjectActive2D(state, {
            type: POLYGON,
            // draw straight line between drag start and current position
            points: [preDrags[0], preDrags[preDrags.length - 1]]
          });
        }

        case tools.BRUSH: {
          return addObjectActive2D(state, {
            type: BRUSH,
            strokeWidth: state.d2.brush.size,
            points: preDrags
          });
        }

        case tools.FREE_HAND: {
          return addObjectActive2D(state, {
            type: FREE_HAND,
            points: preDrags
          });
        }

        default:
          return state;
      }
    }
    case actions.D2_DRAG: {
      if (activeShape) {
        const shapeData = state.objectsById[activeShape];
        const points = shapeData.points;

        const matrix = shapeData.transform.multiplyMatrix(screenMatrixZoom).inverseMatrix();
        const position = screenPosition.applyMatrix(matrix);

        switch (activeTool) {
          case tools.POLYGON: {
            return update(state, {
              objectsById: {
                [activeShape]: {
                  points: { [points.length - 1]: { $set: position } }
                }
              }
            }); // update last point to curren mouse position
          }
          case tools.BRUSH:
          case tools.FREE_HAND: {
            state = update(state, {
              objectsById: {
                [activeShape]: {
                  points: { $push: [position] }
                }
              }
            }); // add current mouse position to points array
          }
          default:
            return state;
        }
      }
      return state;
    }
    case actions.D2_DRAG_END: {
      if (activeShape) {
        state = setActive2D(state, null);

        const currentShapeData = state.objectsById[activeShape];
        const shapeProps = SHAPE_TYPE_PROPERTIES[currentShapeData.type];
        if (!shapeProps.snapping) return state;

        let currentPoints = currentShapeData.points;

        // smooth
        if (activeTool === tools.FREE_HAND) {
          // convert to screen space
          currentPoints = currentPoints.map(point => point.applyMatrix(screenMatrixZoom));
          // smooth path
          currentPoints = segmentBezierPath(fitPath(currentPoints));
          // convert back to object space
          currentPoints = currentPoints.map(point => point.applyMatrix(screenMatrixZoomInverse));
        }

        const currentStartPoint = currentPoints[0].applyMatrix(screenMatrixZoom);
        const currentEndPoint = currentPoints[currentPoints.length - 1].applyMatrix(screenMatrixZoom);

        // create list of possible snapping connections
        // sorts on distance to connection and filters out connections that exceed the snapping threshold
        const snappingDistance = SNAPPING_DISTANCE + LINE_DIAMETER * screenMatrixZoom.sx;
        const snappingPoints = getSnappingPoints(state, screenMatrixZoom)
          .reduce((points, { shapeData, endPoint, startPoint }) => {
            if (shapeData.UID === activeShape) {
              if (currentPoints.length >= 3) {
                points.push({ shapeData, hit: 'self', distance: endPoint.distanceTo(startPoint) });
              }
            } else {
              points.push(
                { shapeData, hit: 'start-start', distance: currentStartPoint.distanceTo(startPoint) },
                { shapeData, hit: 'start-end', distance: currentStartPoint.distanceTo(endPoint) },
                { shapeData, hit: 'end-start', distance: currentEndPoint.distanceTo(startPoint) },
                { shapeData, hit: 'end-end', distance: currentEndPoint.distanceTo(endPoint) }
              );
            }
            return points;
          }, [])
          .filter(({ distance }) => distance < snappingDistance)
          .sort((a, b) => a.distance - b.distance);

        const hits = snappingPoints.map(snappingPoint => snappingPoint.hit);
        if (hits.includes('start-end') && hits.includes('end-end')) {
          const index = Math.max(hits.indexOf('start-end') && hits.indexOf('end-end'));
          snappingPoints.splice(index, 1);
        }
        if (hits.includes('start-start') && hits.includes('end-start')) {
          const index = Math.max(hits.indexOf('start-start') && hits.indexOf('end-start'));
          snappingPoints.splice(index, 1);
        }

        // the active shape's start and end points can only be connected to one other shape,
        // this variable can be used to check if the start or end point is already been snapped to
        // when the point has a connection it stores the shape UID of the connected shape
        let currentEndPointHit = false;
        let currentStartPointHit = false;

        for (const { hit, shapeData } of snappingPoints) {
          let newPoints;
          if (hit !== 'self') {
            const newMatrix = shapeData.transform.multiplyMatrix(currentShapeData.transform.inverseMatrix());
            newPoints = shapeData.points.map(point => point.applyMatrix(newMatrix));
          }

          if (hit === 'start-start' || hit === 'end-end') newPoints.reverse();

          switch (hit) {
            case 'self':
              // can only connect to self if end point AND start point aren't connected yet
              if (!currentEndPointHit && !currentStartPointHit) {
                currentEndPointHit = shapeData.UID;
                currentStartPointHit = shapeData.UID;

                currentPoints = update(currentPoints, {
                  [currentPoints.length - 1]: { $set: currentPoints[0].clone() }
                });
              }
              break;

            case 'start-start':
            case 'start-end':
              // can only connect start point if start point isn't connected yet
              if (!currentStartPointHit) {
                currentStartPointHit = shapeData.UID;

                if (currentEndPointHit === shapeData.UID) {
                  // if the end point is connected to the same shape it has already been added to
                  // the end of the shape and does not have to be added to the start of the shape
                  if (activeTool === tools.FREE_HAND) {
                    currentPoints = update(currentPoints, {
                      $push: [currentPoints[0].clone()]
                    });
                  } else if (activeTool === tools.POLYGON) {
                    currentPoints = update(currentPoints, {
                      [currentPoints.length - 1]: { $set: currentPoints[0].clone() }
                    });
                  }
                } else {
                  // add the shape to the start of the active shape
                  if (activeTool === tools.FREE_HAND) {
                    currentPoints = update(currentPoints, {
                      $splice: [[0, 0, ...newPoints]]
                    });
                  } else if (activeTool === tools.POLYGON) {
                    currentPoints = update(currentPoints, {
                      $splice: [[0, 1, ...newPoints]]
                    });
                  }
                }

                if (state.objectsById[shapeData.UID]) state = removeObject(state, shapeData.UID);
              }
              break;

            case 'end-start':
            case 'end-end':
              if (!currentEndPointHit) {
                currentEndPointHit = shapeData.UID;

                if (currentStartPointHit === shapeData.UID) {
                  // if the start point is connected to the same shape it has already been added to
                  // the start of the shape and does not have to be added to the end of the shape
                  if (activeTool === tools.FREE_HAND) {
                    currentPoints = update(currentPoints, {
                      $push: [currentPoints[0].clone()]
                    });
                  } else if (activeTool === tools.POLYGON) {
                    currentPoints = update(currentPoints, {
                      [currentPoints.length - 1]: { $set: currentPoints[0].clone() }
                    });
                  }
                } else {
                  // add the shape to the end of the active shape
                  if (activeTool === tools.FREE_HAND) {
                    currentPoints = update(currentPoints, {
                      $push: newPoints
                    });
                  } else if (activeTool === tools.POLYGON) {
                    currentPoints = update(currentPoints, {
                      $splice: [[currentPoints.length - 1, 1, ...newPoints]]
                    });
                  }
                }

                if (state.objectsById[shapeData.UID]) state = removeObject(state, shapeData.UID);
              }
              break;

            default:
              break;
          }
        }

        state = update(state, {
          objectsById: {
            [activeShape]: {
              points: { $set: currentPoints }
            }
          }
        });
      }
      return state;
    }
    default:
      return state;
  }
}
