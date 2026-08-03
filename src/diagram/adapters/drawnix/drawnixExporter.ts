import {
    createDrawnixMindMapArrowElements,
    DrawnixMindMapArrowElement,
    DrawnixMindMapElement,
    DrawnixMindMapProjection
} from './drawnixMindMapProjection';
import type { SourceVisualKind, SourceVisualStatus } from '../../sourceVisuals';

export interface DrawnixSourceVisualAttachment {
    id: string;
    kind: SourceVisualKind;
    status: SourceVisualStatus;
    sourceHash: string;
    sourcePath?: string;
    companionPaths: string[];
    diagnostic?: string;
}

export interface DrawnixMindMapMetadata {
    notemd: {
        version: 1;
        sourceVisuals: DrawnixSourceVisualAttachment[];
    };
}

export interface DrawnixMindMapExportedData {
    type: 'drawnix';
    version: 1;
    source: 'web';
    elements: Array<DrawnixMindMapElement | DrawnixMindMapArrowElement>;
    viewport: {
        zoom: number;
        offsetX: number;
        offsetY: number;
    };
    /**
     * Namespaced metadata keeps source visuals discoverable without adding
     * unverified image elements to the native Drawnix element stream.
     */
    metadata?: DrawnixMindMapMetadata;
}

export function exportDrawnixMindMapProjection(
    projection: DrawnixMindMapProjection,
    sourceVisuals: readonly DrawnixSourceVisualAttachment[] = []
): DrawnixMindMapExportedData {
    const metadata = sourceVisuals.length > 0
        ? {
            notemd: {
                version: 1 as const,
                sourceVisuals: sourceVisuals.map(visual => ({ ...visual, companionPaths: [...visual.companionPaths] }))
            }
        }
        : undefined;
    return {
        type: 'drawnix',
        version: 1,
        source: 'web',
        elements: [
            ...projection.roots,
            ...createDrawnixMindMapArrowElements(projection.crossRelations)
        ],
        viewport: {
            zoom: 1,
            offsetX: 0,
            offsetY: 0
        },
        ...(metadata ? { metadata } : {})
    };
}

export function stringifyDrawnixMindMapExportedData(data: DrawnixMindMapExportedData): string {
    return `${JSON.stringify(data, null, 2)}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMindMapPoint(value: unknown): boolean {
    return Array.isArray(value)
        && value.length === 2
        && typeof value[0] === 'number'
        && Number.isFinite(value[0])
        && typeof value[1] === 'number'
        && Number.isFinite(value[1]);
}

function validateMindMapElement(element: unknown, isRoot: boolean, ids: Set<string>, errors: string[]): void {
    if (!isRecord(element)) {
        errors.push('mind-map element must be an object');
        return;
    }
    const id = typeof element.id === 'string' && element.id.trim() ? element.id : '<missing>';
    if (id === '<missing>') {
        errors.push('mind-map element is missing an id');
    } else if (ids.has(id)) {
        errors.push(`mind-map element id "${id}" is duplicated`);
    } else {
        ids.add(id);
    }
    if (element.type !== (isRoot ? 'mindmap' : 'mind_child')) {
        errors.push(`mind-map element ${id} has an invalid type`);
    }
    if (isRoot && (!Array.isArray(element.points) || element.points.length !== 1 || !isMindMapPoint(element.points[0]))) {
        errors.push(`mind-map root ${id} must define one numeric point`);
    }
    const data = isRecord(element.data) ? element.data : undefined;
    const topic = data && isRecord(data.topic) ? data.topic : undefined;
    if (!topic || topic.type !== 'paragraph' || !Array.isArray(topic.children)
        || !topic.children.every(child => isRecord(child) && typeof child.text === 'string')) {
        errors.push(`mind-map element ${id} must define a paragraph topic`);
    }
    if (!Array.isArray(element.children)) {
        errors.push(`mind-map element ${id} children must be an array`);
        return;
    }
    element.children.forEach(child => validateMindMapElement(child, false, ids, errors));
}

export function validateDrawnixMindMapExportedData(data: unknown): string[] {
    const errors: string[] = [];
    if (!isRecord(data)) {
        return ['drawnix export data must be an object'];
    }
    if (data.type !== 'drawnix') {
        errors.push('drawnix export data type must be "drawnix"');
    }
    if (data.version !== 1) {
        errors.push('drawnix export data version must be 1');
    }
    if (data.source !== 'web') {
        errors.push('drawnix export data source must be "web"');
    }
    if (!isRecord(data.viewport)) {
        errors.push('drawnix export data viewport must be an object');
    }
    if (!Array.isArray(data.elements) || data.elements.length === 0) {
        errors.push('drawnix mind-map export must contain at least one root element');
        return errors;
    }

    const ids = new Set<string>();
    let relationIndex = 0;
    let rootCount = 0;
    let relationsStarted = false;
    data.elements.forEach(element => {
        if (isRecord(element) && element.type === 'mindmap' && !relationsStarted) {
            rootCount += 1;
            validateMindMapElement(element, true, ids, errors);
            return;
        }
        relationsStarted = true;
        relationIndex += 1;
        if (!isRecord(element) || element.type !== 'arrow-line') {
            errors.push(`cross-relation ${relationIndex} must use type "arrow-line"`);
            return;
        }
        if (!Array.isArray(element.points) || element.points.length < 2 || !element.points.every(isMindMapPoint)) {
            errors.push(`cross-relation ${relationIndex} must define numeric points`);
        }
        const source = isRecord(element.source) && typeof element.source.id === 'string' ? element.source.id : undefined;
        const target = isRecord(element.target) && typeof element.target.id === 'string' ? element.target.id : undefined;
        if (!source || !ids.has(source) || !target || !ids.has(target)) {
            errors.push(`cross-relation ${relationIndex} references an unknown mind-map node`);
        }
    });

    if (rootCount === 0) {
        errors.push('drawnix mind-map export must contain at least one root element');
    }

    return errors;
}
