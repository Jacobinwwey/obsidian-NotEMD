import {
    createDrawnixMindMapArrowElements,
    DrawnixMindMapArrowElement,
    DrawnixMindMapElement,
    DrawnixMindMapProjection
} from './drawnixMindMapProjection';
import { validateDiagramSpec } from '../../spec';
import type { DiagramEdge, DiagramNode, DiagramSpec } from '../../types';
import type { SourceVisualKind, SourceVisualStatus } from '../../sourceVisuals';

export const DRAWNIX_EXPORT_VERSION = 1 as const;
export const DRAWNIX_SOURCE_VISUAL_METADATA_VERSION = 1 as const;
export const DRAWNIX_KNOWLEDGE_MAP_REPLAY_VERSION = 1 as const;

export interface DrawnixSourceVisualAttachment {
    id: string;
    kind: SourceVisualKind;
    status: SourceVisualStatus;
    sourceHash: string;
    sourcePath?: string;
    companionPaths: string[];
    diagnostic?: string;
    /** Inline source visuals make the Drawnix artifact self-contained. */
    embeddedSvg?: string;
    sourceContent?: string;
    title?: string;
    lineStart?: number;
    lineEnd?: number;
}

export interface DrawnixMindMapMetadata {
    notemd: {
        version: typeof DRAWNIX_SOURCE_VISUAL_METADATA_VERSION;
        sourceVisuals: DrawnixSourceVisualAttachment[];
        knowledgeMap?: DrawnixKnowledgeMapReplayRecord;
    };
}

/**
 * Replay retains only semantic map data. Pixel geometry, source Markdown,
 * source-coverage diagnostics, and user settings stay outside the export.
 */
export interface PersistedDrawnixKnowledgeMapSpec {
    intent: 'drawnixMindmap';
    title: string;
    summary?: string;
    nodes: DiagramNode[];
    edges?: DiagramEdge[];
    sourceLanguage?: string;
    outputLanguage?: string;
    evidenceRefs?: string[];
}

export interface DrawnixKnowledgeMapReplayRecord {
    version: typeof DRAWNIX_KNOWLEDGE_MAP_REPLAY_VERSION;
    catalogTypeId: 'drawnix-knowledge-map';
    semanticSpec: PersistedDrawnixKnowledgeMapSpec;
    semanticSpecHash: string;
    /** Absolute vault-relative paths written by the persistence boundary. */
    deliveryManifestPaths: string[];
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

function cloneReplayNode(node: DiagramNode): DiagramNode {
    return {
        id: node.id,
        label: node.label,
        ...(node.kind ? { kind: node.kind } : {}),
        ...(node.children?.length ? { children: node.children.map(cloneReplayNode) } : {})
    };
}

function cloneReplayEdge(edge: DiagramEdge): DiagramEdge {
    return {
        from: edge.from,
        to: edge.to,
        ...(edge.label?.trim() ? { label: edge.label } : {}),
        ...(edge.relation?.trim() ? { relation: edge.relation } : {})
    };
}

function buildPersistedDrawnixKnowledgeMapSpec(spec: DiagramSpec): PersistedDrawnixKnowledgeMapSpec {
    if (spec.intent !== 'drawnixMindmap') {
        throw new Error('Drawnix knowledge-map replay records require the drawnixMindmap intent.');
    }

    return {
        intent: 'drawnixMindmap',
        title: spec.title,
        ...(spec.summary?.trim() ? { summary: spec.summary } : {}),
        nodes: spec.nodes.map(cloneReplayNode),
        ...(spec.edges?.length ? { edges: spec.edges.map(cloneReplayEdge) } : {}),
        ...(spec.sourceLanguage?.trim() ? { sourceLanguage: spec.sourceLanguage } : {}),
        ...(spec.outputLanguage?.trim() ? { outputLanguage: spec.outputLanguage } : {}),
        ...(spec.evidenceRefs?.length ? { evidenceRefs: [...spec.evidenceRefs] } : {})
    };
}

function hashReplaySemanticSpec(spec: PersistedDrawnixKnowledgeMapSpec): string {
    const source = JSON.stringify(spec);
    let hash = 2166136261;
    for (const character of source) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function cloneReplayRecord(record: DrawnixKnowledgeMapReplayRecord): DrawnixKnowledgeMapReplayRecord {
    return {
        version: record.version,
        catalogTypeId: record.catalogTypeId,
        semanticSpec: buildPersistedDrawnixKnowledgeMapSpec(record.semanticSpec),
        semanticSpecHash: record.semanticSpecHash,
        deliveryManifestPaths: [...record.deliveryManifestPaths]
    };
}

/** Creates the additive replay payload used to switch delivery without an LLM call. */
export function createDrawnixKnowledgeMapReplayRecord(
    spec: DiagramSpec,
    deliveryManifestPaths: readonly string[] = []
): DrawnixKnowledgeMapReplayRecord {
    const semanticSpec = buildPersistedDrawnixKnowledgeMapSpec(spec);
    const validation = validateDiagramSpec(semanticSpec);
    if (!validation.valid) {
        throw new Error(`Cannot persist invalid Drawnix knowledge-map replay data: ${validation.errors.join(' ')}`);
    }

    return {
        version: DRAWNIX_KNOWLEDGE_MAP_REPLAY_VERSION,
        catalogTypeId: 'drawnix-knowledge-map',
        semanticSpec,
        semanticSpecHash: hashReplaySemanticSpec(semanticSpec),
        deliveryManifestPaths: [...deliveryManifestPaths]
    };
}

export function exportDrawnixMindMapProjection(
    projection: DrawnixMindMapProjection,
    sourceVisuals: readonly DrawnixSourceVisualAttachment[] = [],
    knowledgeMapReplay?: DrawnixKnowledgeMapReplayRecord
): DrawnixMindMapExportedData {
    if (knowledgeMapReplay && !isDrawnixKnowledgeMapReplayRecord(knowledgeMapReplay)) {
        throw new Error('Drawnix knowledge-map replay record failed validation before export.');
    }

    const metadata = sourceVisuals.length > 0 || knowledgeMapReplay
        ? {
            notemd: {
                version: DRAWNIX_SOURCE_VISUAL_METADATA_VERSION,
                sourceVisuals: sourceVisuals.map(visual => ({ ...visual, companionPaths: [...visual.companionPaths] })),
                ...(knowledgeMapReplay ? { knowledgeMap: cloneReplayRecord(knowledgeMapReplay) } : {})
            }
        }
        : undefined;
    return {
        type: 'drawnix',
        version: DRAWNIX_EXPORT_VERSION,
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

function isReplayNode(value: unknown): value is DiagramNode {
    if (!isRecord(value)
        || typeof value.id !== 'string'
        || !value.id.trim()
        || typeof value.label !== 'string'
        || !value.label.trim()
        || (value.kind !== undefined && typeof value.kind !== 'string')) {
        return false;
    }
    return value.children === undefined
        || Array.isArray(value.children) && value.children.every(isReplayNode);
}

function isReplayEdge(value: unknown): value is DiagramEdge {
    return isRecord(value)
        && typeof value.from === 'string'
        && value.from.trim().length > 0
        && typeof value.to === 'string'
        && value.to.trim().length > 0
        && (value.label === undefined || typeof value.label === 'string')
        && (value.relation === undefined || typeof value.relation === 'string');
}

function isPersistedDrawnixKnowledgeMapSpec(value: unknown): value is PersistedDrawnixKnowledgeMapSpec {
    if (!isRecord(value)
        || value.intent !== 'drawnixMindmap'
        || typeof value.title !== 'string'
        || !value.title.trim()
        || (value.summary !== undefined && typeof value.summary !== 'string')
        || !Array.isArray(value.nodes)
        || !value.nodes.every(isReplayNode)
        || (value.edges !== undefined && (!Array.isArray(value.edges) || !value.edges.every(isReplayEdge)))
        || (value.sourceLanguage !== undefined && typeof value.sourceLanguage !== 'string')
        || (value.outputLanguage !== undefined && typeof value.outputLanguage !== 'string')
        || (value.evidenceRefs !== undefined
            && (!Array.isArray(value.evidenceRefs) || !value.evidenceRefs.every(reference => typeof reference === 'string')))) {
        return false;
    }

    const persistedSpec = value as unknown as PersistedDrawnixKnowledgeMapSpec;
    return validateDiagramSpec(persistedSpec).valid;
}

export function isDrawnixKnowledgeMapReplayRecord(value: unknown): value is DrawnixKnowledgeMapReplayRecord {
    if (!isRecord(value)
        || value.version !== DRAWNIX_KNOWLEDGE_MAP_REPLAY_VERSION
        || value.catalogTypeId !== 'drawnix-knowledge-map'
        || !isPersistedDrawnixKnowledgeMapSpec(value.semanticSpec)
        || typeof value.semanticSpecHash !== 'string'
        || !/^fnv1a32:[0-9a-f]{8}$/u.test(value.semanticSpecHash)
        || !Array.isArray(value.deliveryManifestPaths)
        || !value.deliveryManifestPaths.every(path => typeof path === 'string' && path.trim().length > 0)) {
        return false;
    }

    return value.semanticSpecHash === hashReplaySemanticSpec(value.semanticSpec);
}

/**
 * Returns null for legacy files and unknown future replay schemas. Callers
 * can still open the Drawnix board; alternate delivery then requires regen.
 */
export function readDrawnixKnowledgeMapReplayRecord(data: unknown): DrawnixKnowledgeMapReplayRecord | null {
    if (!isRecord(data)
        || data.type !== 'drawnix'
        || !isRecord(data.metadata)
        || !isRecord(data.metadata.notemd)) {
        return null;
    }

    const replay = data.metadata.notemd.knowledgeMap;
    return isDrawnixKnowledgeMapReplayRecord(replay)
        ? cloneReplayRecord(replay)
        : null;
}

function isSourceVisualAttachment(value: unknown): value is DrawnixSourceVisualAttachment {
    if (!isRecord(value)
        || typeof value.id !== 'string'
        || !value.id.trim()
        || (value.kind !== 'mermaid' && value.kind !== 'image')
        || (value.status !== 'resolved' && value.status !== 'unresolved')
        || typeof value.sourceHash !== 'string'
        || !Array.isArray(value.companionPaths)
        || !value.companionPaths.every(path => typeof path === 'string' && path.trim().length > 0)) {
        return false;
    }

    return (value.embeddedSvg === undefined || typeof value.embeddedSvg === 'string')
        && (value.sourceContent === undefined || typeof value.sourceContent === 'string')
        && (value.title === undefined || typeof value.title === 'string')
        && (value.lineStart === undefined || typeof value.lineStart === 'number' && Number.isInteger(value.lineStart))
        && (value.lineEnd === undefined || typeof value.lineEnd === 'number' && Number.isInteger(value.lineEnd));
}

export function isDrawnixMindMapMetadata(value: unknown): value is DrawnixMindMapMetadata {
    if (!isRecord(value)) {
        return false;
    }
    const notemd = value.notemd;
    if (!isRecord(notemd)
        || notemd.version !== DRAWNIX_SOURCE_VISUAL_METADATA_VERSION
        || !Array.isArray(notemd.sourceVisuals)) {
        return false;
    }

    const ids = new Set<string>();
    return notemd.sourceVisuals.every(visual => {
        if (!isSourceVisualAttachment(visual) || ids.has(visual.id)) {
            return false;
        }
        ids.add(visual.id);
        return true;
    });
}

function isMindMapPoint(value: unknown): boolean {
    return Array.isArray(value)
        && value.length === 2
        && typeof value[0] === 'number'
        && Number.isFinite(value[0])
        && typeof value[1] === 'number'
        && Number.isFinite(value[1]);
}

function isArrowLineMarker(value: unknown): value is 'none' | 'arrow' {
    return value === 'none' || value === 'arrow';
}

function validateNativeArrowLine(element: Record<string, unknown>, relationIndex: number, errors: string[]): void {
    if (element.shape !== 'straight' && element.shape !== 'curve' && element.shape !== 'elbow') {
        errors.push(`cross-relation ${relationIndex} must define a native arrow-line shape`);
    }

    const source = isRecord(element.source) ? element.source : undefined;
    const target = isRecord(element.target) ? element.target : undefined;
    if (!source || !isArrowLineMarker(source.marker)) {
        errors.push(`cross-relation ${relationIndex} source must define a native marker`);
    }
    if (!target || !isArrowLineMarker(target.marker)) {
        errors.push(`cross-relation ${relationIndex} target must define a native marker`);
    }

    if (!Array.isArray(element.texts)) {
        errors.push(`cross-relation ${relationIndex} must define native texts`);
    } else {
        element.texts.forEach((text, textIndex) => {
            if (!isRecord(text) || typeof text.position !== 'number' || !Number.isFinite(text.position)
                || text.position < 0 || text.position > 1) {
                errors.push(`cross-relation ${relationIndex} text ${textIndex + 1} must define a position between 0 and 1`);
                return;
            }
            const paragraph = isRecord(text.text) ? text.text : undefined;
            if (!paragraph || paragraph.type !== 'paragraph' || !Array.isArray(paragraph.children)
                || !paragraph.children.every(child => isRecord(child) && typeof child.text === 'string')) {
                errors.push(`cross-relation ${relationIndex} text ${textIndex + 1} must define a paragraph`);
            }
        });
    }

    if (typeof element.opacity !== 'number' || !Number.isFinite(element.opacity)) {
        errors.push(`cross-relation ${relationIndex} must define native opacity`);
    }
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
    if (data.metadata !== undefined && !isDrawnixMindMapMetadata(data.metadata)) {
        errors.push('drawnix export metadata must use the supported notemd source-visual schema version');
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
        validateNativeArrowLine(element, relationIndex, errors);
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
