export type DrawnixKnowledgeMapVisualRole =
    | 'root'
    | 'domain'
    | 'subsystem'
    | 'component'
    | 'evidence'
    | 'external'
    | 'cross-relation';

export interface DrawnixKnowledgeMapPresentationContract {
    viewportWidth: number;
    viewportHeight: number;
    minimumNodeFontSize: number;
    audience: 'working-session' | 'review' | 'presentation';
    language?: string;
}

export interface DrawnixKnowledgeMapPresentationNode {
    id: string;
    semanticNodeId: string;
    rootId: string;
    label: string;
    role: DrawnixKnowledgeMapVisualRole;
    depth: number;
    x: number;
    y: number;
    width: number;
    height: number;
    textLines: string[];
    context: boolean;
    summary: boolean;
}

export interface DrawnixKnowledgeMapPresentationBranch {
    parentNodeId: string;
    childNodeId: string;
    start: [number, number];
    end: [number, number];
}

export interface DrawnixKnowledgeMapPresentationRelation {
    id: string;
    semanticRelationId: string;
    sourceSemanticNodeId: string;
    targetSemanticNodeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    label?: string;
    labelLines?: string[];
    labelPosition?: [number, number];
    route?: Array<[number, number]>;
    summary: boolean;
}

export interface DrawnixKnowledgeMapPresentationSlice {
    id: string;
    kind: 'overview' | 'detail';
    title: string;
    summary?: string;
    rootId?: string;
    nodes: DrawnixKnowledgeMapPresentationNode[];
    branches: DrawnixKnowledgeMapPresentationBranch[];
    relations: DrawnixKnowledgeMapPresentationRelation[];
    width: number;
    height: number;
}

export interface DrawnixKnowledgeMapNodeLedgerLocation {
    nodeId: string;
    sliceIds: string[];
}

export interface DrawnixKnowledgeMapRelationLedgerLocation {
    relationId: string;
    sliceIds: string[];
}

export interface DrawnixKnowledgeMapFidelityDecision {
    kind: 'overview-summary' | 'detail-partition' | 'external-relation-endpoint';
    message: string;
    sliceId: string;
}

export interface DrawnixKnowledgeMapFidelityLedger {
    nodeLocations: DrawnixKnowledgeMapNodeLedgerLocation[];
    relationLocations: DrawnixKnowledgeMapRelationLedgerLocation[];
    decisions: DrawnixKnowledgeMapFidelityDecision[];
}

export interface DrawnixKnowledgeMapPresentation {
    contract: DrawnixKnowledgeMapPresentationContract;
    overview: DrawnixKnowledgeMapPresentationSlice;
    details: DrawnixKnowledgeMapPresentationSlice[];
    ledger: DrawnixKnowledgeMapFidelityLedger;
}
