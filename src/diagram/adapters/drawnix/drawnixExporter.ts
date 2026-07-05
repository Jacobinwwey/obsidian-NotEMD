import {
    SemanticFigureEdge,
    SemanticFigureModel,
    SemanticFigureNode
} from '../editableSvg/semanticFigureModel';

type DrawnixPoint = [number, number];
type SupportedDrawnixElementType = 'geometry' | 'arrow-line';

export interface DrawnixTextValue {
    children: Array<{ text: string }>;
}

export interface DrawnixGeometryElement {
    id: string;
    type: 'geometry';
    shape: 'rectangle';
    points: [DrawnixPoint, DrawnixPoint];
    text: DrawnixTextValue;
    style: {
        fill: string;
        stroke: string;
    };
    data: {
        notemdRole: string;
        source: 'SemanticFigureModel';
    };
}

export interface DrawnixArrowLineElement {
    id: string;
    type: 'arrow-line';
    points: [DrawnixPoint, DrawnixPoint];
    source: { id: string };
    target: { id: string };
    text: DrawnixTextValue;
    style: {
        stroke: string;
        dashed?: boolean;
    };
    data: {
        source: 'SemanticFigureModel';
    };
}

export type DrawnixElementSubset = DrawnixGeometryElement | DrawnixArrowLineElement;

export interface DrawnixExportedDataSubset {
    type: 'drawnix';
    version: 1;
    source: 'web';
    elements: DrawnixElementSubset[];
    viewport: {
        zoom: number;
        offsetX: number;
        offsetY: number;
    };
    theme: 'default';
}

const NODE_STYLE_BY_ROLE: Record<string, DrawnixGeometryElement['style']> = {
    actor: { fill: '#dae8fc', stroke: '#6c8ebf' },
    boundary: { fill: '#fff2cc', stroke: '#d6b656' },
    processor: { fill: '#d5e8d4', stroke: '#82b366' },
    process: { fill: '#f8cecc', stroke: '#b85450' },
    state: { fill: '#e1d5e7', stroke: '#9673a6' }
};

const DEFAULT_NODE_STYLE: DrawnixGeometryElement['style'] = { fill: '#f5f5f5', stroke: '#666666' };
const ASYNC_RELATIONS = new Set(['async', 'asynchronous', 'queue', 'queued']);

function createTextValue(text: string): DrawnixTextValue {
    return { children: [{ text }] };
}

function resolveNodeStyle(node: SemanticFigureNode): DrawnixGeometryElement['style'] {
    return NODE_STYLE_BY_ROLE[node.role.toLowerCase()] ?? DEFAULT_NODE_STYLE;
}

function exportNode(node: SemanticFigureNode): DrawnixGeometryElement {
    return {
        id: node.id,
        type: 'geometry',
        shape: 'rectangle',
        points: [
            [node.x, node.y],
            [node.x + node.width, node.y + node.height]
        ],
        text: createTextValue(node.label),
        style: resolveNodeStyle(node),
        data: {
            notemdRole: node.role,
            source: 'SemanticFigureModel'
        }
    };
}

function exportEdge(edge: SemanticFigureEdge): DrawnixArrowLineElement {
    const relation = edge.relation?.trim().toLowerCase();
    const style: DrawnixArrowLineElement['style'] = { stroke: '#64748b' };
    if (relation && ASYNC_RELATIONS.has(relation)) {
        style.dashed = true;
    }

    return {
        id: edge.id,
        type: 'arrow-line',
        points: [
            [edge.startX, edge.startY],
            [edge.endX, edge.endY]
        ],
        source: { id: edge.sourceId },
        target: { id: edge.targetId },
        text: createTextValue(edge.label ?? edge.relation ?? ''),
        style,
        data: {
            source: 'SemanticFigureModel'
        }
    };
}

function readElementId(element: unknown): string {
    if (!element || typeof element !== 'object' || !('id' in element)) {
        return '<missing>';
    }

    const id = (element as { id?: unknown }).id;
    return typeof id === 'string' && id.trim() ? id : '<missing>';
}

function readElementType(element: unknown): string {
    if (!element || typeof element !== 'object' || !('type' in element)) {
        return '<missing>';
    }

    const type = (element as { type?: unknown }).type;
    return typeof type === 'string' && type.trim() ? type : '<missing>';
}

export function exportSemanticFigureModelToDrawnixData(model: SemanticFigureModel): DrawnixExportedDataSubset {
    return {
        type: 'drawnix',
        version: 1,
        source: 'web',
        elements: [
            ...model.nodes.map(exportNode),
            ...model.edges.map(exportEdge)
        ],
        viewport: {
            zoom: 1,
            offsetX: 0,
            offsetY: 0
        },
        theme: 'default'
    };
}

export function stringifyDrawnixExportedData(data: DrawnixExportedDataSubset): string {
    return `${JSON.stringify(data, null, 2)}\n`;
}

export function validateDrawnixExportedDataSubset(data: unknown): string[] {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') {
        return ['drawnix export data must be an object'];
    }

    const candidate = data as { type?: unknown; version?: unknown; source?: unknown; elements?: unknown; viewport?: unknown };
    if (candidate.type !== 'drawnix') {
        errors.push('drawnix export data type must be "drawnix"');
    }
    if (candidate.version !== 1) {
        errors.push('drawnix export data version must be 1');
    }
    if (candidate.source !== 'web') {
        errors.push('drawnix export data source must be "web"');
    }
    if (!Array.isArray(candidate.elements)) {
        errors.push('drawnix export data elements must be an array');
        return errors;
    }
    if (!candidate.viewport || typeof candidate.viewport !== 'object') {
        errors.push('drawnix export data viewport must be an object');
    }

    for (const element of candidate.elements) {
        const type = readElementType(element);
        if (!(['geometry', 'arrow-line'] as SupportedDrawnixElementType[]).includes(type as SupportedDrawnixElementType)) {
            errors.push(`element ${readElementId(element)} uses unsupported drawnix subset type "${type}"`);
        }
    }

    return errors;
}
