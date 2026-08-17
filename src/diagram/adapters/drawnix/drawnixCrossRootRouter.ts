/**
 * @deprecated Import from `drawnixRelationRouter` instead. This module keeps
 * older maintainer scripts and tests source-compatible while the production
 * projection uses the relation-router boundary.
 */
export {
    findDrawnixDirectReservedLaneRoute,
    routeDrawnixRelationThroughReservedLane,
    routeDrawnixCrossRootRelation
} from './drawnixRelationRouter';

export type {
    DrawnixCrossRootRouteStrategy,
    DrawnixCrossRootRoute,
    DrawnixRelationLabelSize,
    DrawnixCrossRootRouteObstacle,
    DrawnixCrossRootRouterInput,
    DrawnixReservedRelationLaneRouterInput,
    DrawnixReservedRelationLaneRoute
} from './drawnixRelationRouter';
