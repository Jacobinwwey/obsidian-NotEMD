import { getExecutableDiagramExamples } from '../diagram/examples/diagramExampleCatalog';
import {
    getExecutableDiagramType,
    findDefaultDiagramType,
    type ExecutableDiagramTypeDefinition
} from '../diagram/diagramTypeCatalog';
import type { DiagramCatalogTypeId, DiagramIntent } from '../diagram/types';
import { getRenderTargetDisplayName } from '../rendering/targetLabel';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';
import { assertSvgPresentationSafety } from '../rendering/preview/svgSafety';
import type { DiagramCatalogLabelCopy } from './diagramCatalogLabels';

export interface DiagramTypePreviewPanelCopy extends DiagramCatalogLabelCopy {
    title: string;
    empty: string;
    loading: string;
    unavailable: string;
    failed: string;
    targetPrefix: string;
    formatsPrefix: string;
    previewOverflowHint?: string;
}

export interface DiagramTypePreviewPanelController {
    setSelectedType(typeId: DiagramCatalogTypeId | undefined): void;
    destroy(): void;
}

export interface DiagramTypePreviewPanelParams {
    parent: HTMLElement;
    copy: DiagramTypePreviewPanelCopy;
    renderThumbnail: (typeId: DiagramCatalogTypeId) => Promise<string | undefined>;
}

function getTypeIdForIntent(intent: string | undefined): DiagramCatalogTypeId | undefined {
    if (!intent || intent === 'auto') {
        return undefined;
    }

    try {
        const type = getExecutableDiagramType(intent as DiagramCatalogTypeId);
        return type.id;
    } catch {
        // Legacy settings stored semantic intents rather than catalog IDs.
    }

    try {
        return findDefaultDiagramType(intent as DiagramIntent).id;
    } catch {
        const example = getExecutableDiagramExamples().find(candidate => candidate.sourceIntent === intent);
        return example?.typeId;
    }
}

function setText(parent: HTMLElement, text: string, className: string): void {
    parent.empty();
    parent.createEl('p', { text, cls: className });
}

export function resolveDiagramPreviewTypeId(intent: string | undefined): DiagramCatalogTypeId | undefined {
    return getTypeIdForIntent(intent);
}

export function renderDiagramTypePreviewPanel(
    params: DiagramTypePreviewPanelParams
): DiagramTypePreviewPanelController {
    const panel = params.parent.createDiv({ cls: 'notemd-diagram-type-preview-panel' });
    panel.setAttr('role', 'region');
    panel.setAttr('aria-live', 'polite');

    const heading = panel.createEl('h4', {
        text: params.copy.title,
        cls: 'notemd-diagram-type-preview-title'
    });
    const meta = panel.createDiv({ cls: 'notemd-diagram-type-preview-meta' });
    const canvas = panel.createDiv({ cls: 'notemd-diagram-type-preview-canvas' });

    const setPreviewState = (state: string, busy: boolean): void => {
        panel.setAttr('data-preview-state', state);
        panel.setAttr('aria-busy', busy ? 'true' : 'false');
        canvas.setAttr('data-preview-state', state);
        canvas.setAttr('aria-busy', busy ? 'true' : 'false');
    };

    let requestVersion = 0;
    let destroyed = false;

    const controller: DiagramTypePreviewPanelController = {
        setSelectedType(typeId) {
            const currentVersion = ++requestVersion;
            if (destroyed) {
                return;
            }

            if (!typeId) {
                heading.setText(params.copy.title);
                meta.empty();
                setPreviewState('empty', false);
                setText(canvas, params.copy.empty, 'notemd-diagram-type-preview-empty');
                return;
            }

            let type: ExecutableDiagramTypeDefinition;
            try {
                type = getExecutableDiagramType(typeId);
            } catch (error) {
                console.error('Could not resolve selected diagram type "' + typeId + '":', error);
                setPreviewState('unavailable', false);
                setText(canvas, params.copy.unavailable, 'notemd-diagram-type-preview-error');
                return;
            }
            const example = getExecutableDiagramExamples().find(candidate => candidate.typeId === typeId);
            if (!example) {
                setPreviewState('unavailable', false);
                setText(canvas, params.copy.unavailable, 'notemd-diagram-type-preview-error');
                return;
            }

            const label = getLocalizedTypeLabel(type, params.copy);
            const descriptor = getRenderTargetDescriptor(type.defaultTarget);
            heading.setText(`${params.copy.title}: ${label}`);
            meta.empty();
            meta.createEl('span', {
                text: `${params.copy.targetPrefix}: ${getRenderTargetDisplayName(type.defaultTarget)}`,
                cls: 'notemd-diagram-type-preview-meta-item'
            });
            meta.createEl('span', {
                text: `${params.copy.formatsPrefix}: ${descriptor.exportFormats.length > 0 ? descriptor.exportFormats.join(', ').toUpperCase() : 'source'}`,
                cls: 'notemd-diagram-type-preview-meta-item'
            });
            setPreviewState('loading', true);
            setText(canvas, params.copy.loading, 'notemd-diagram-type-preview-loading');

            void params.renderThumbnail(typeId).then(svg => {
                if (destroyed || currentVersion !== requestVersion) {
                    return;
                }
                if (!svg?.trim()) {
                    setPreviewState('unavailable', false);
                    setText(canvas, params.copy.unavailable, 'notemd-diagram-type-preview-error');
                    return;
                }
                canvas.innerHTML = svg;
                assertSvgPresentationSafety(canvas, `Diagram type "${typeId}"`);
                setPreviewState('ready', false);
                const renderedSvg = canvas.querySelector('svg');
                if (renderedSvg) {
                    renderedSvg.setAttribute('role', 'img');
                    renderedSvg.setAttribute('aria-label', label);
                    // A fixed 16:9 thumbnail is an interaction surface, not the
                    // source artifact. Preserve the source aspect ratio and let
                    // the host scroll when a dense matrix cannot remain legible
                    // at thumbnail scale. Stretching a 880x532 matrix into a
                    // 16:9 box was the root of the reported text-obscuring UX.
                    renderedSvg.classList.add('notemd-diagram-type-preview-svg');
                    const viewBox = renderedSvg.viewBox?.baseVal;
                    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
                        canvas.setAttribute('data-preview-aspect-ratio', `${viewBox.width}/${viewBox.height}`);
                        const minimumReadableWidth = Math.max(520, Math.ceil(viewBox.width * 0.8));
                        renderedSvg.style.minWidth = `${minimumReadableWidth}px`;
                        renderedSvg.setAttribute('data-preview-min-readable-width', String(minimumReadableWidth));
                        if (minimumReadableWidth > canvas.clientWidth) {
                            const hint = canvas.createEl('p', {
                                text: params.copy.previewOverflowHint ?? 'Wider preview: scroll horizontally to inspect labels.',
                                cls: 'notemd-diagram-type-preview-overflow-hint'
                            });
                            hint.setAttr('role', 'status');
                        }
                    }
                }
            }).catch(error => {
                if (destroyed || currentVersion !== requestVersion) {
                    return;
                }
                console.error(`Could not render selected diagram preview "${typeId}":`, error);
                setPreviewState('error', false);
                setText(canvas, params.copy.failed, 'notemd-diagram-type-preview-error');
            });
        },
        destroy() {
            destroyed = true;
            requestVersion += 1;
            panel.remove();
        }
    };

    controller.setSelectedType(undefined);
    return controller;
}

function getLocalizedTypeLabel(type: ExecutableDiagramTypeDefinition, copy: DiagramCatalogLabelCopy): string {
    switch (type.id) {
        case 'bar-chart': return copy.intentBarChart ?? `${copy.intentDataChart}: Bar`;
        case 'line-chart': return copy.intentLineChart ?? `${copy.intentDataChart}: Line`;
        case 'scatter-plot': return copy.intentScatterPlot ?? `${copy.intentDataChart}: Scatter`;
        default: break;
    }

    switch (type.intent) {
        case 'mindmap': return copy.intentMindmap;
        case 'drawnixMindmap': return copy.intentDrawnixKnowledgeMap;
        case 'flowchart': return copy.intentFlowchart;
        case 'sequence': return copy.intentSequence;
        case 'classDiagram': return copy.intentClassDiagram;
        case 'erDiagram': return copy.intentErDiagram;
        case 'stateDiagram': return copy.intentStateDiagram;
        case 'canvasMap': return copy.intentCanvasMap;
        case 'circuit': return copy.intentCircuit;
        case 'dataChart': return copy.intentDataChart;
        case 'radar': return copy.intentRadar;
        case 'orgChart': return copy.intentOrgChart;
        case 'timeline': return copy.intentTimeline;
        case 'swimlane': return copy.intentSwimlane;
        case 'quadrant': return copy.intentQuadrant;
        case 'architecture': return copy.intentArchitecture ?? 'Architecture';
        case 'currentState': return copy.intentCurrentState ?? 'Current state';
        case 'integrationTopology': return copy.intentIntegrationTopology ?? 'Integration topology';
        case 'dataFlow': return copy.intentDataFlow ?? 'Data flow';
        case 'accessMatrix': return copy.intentAccessMatrix ?? 'Access matrix';
        case 'gantt': return copy.intentGantt ?? 'Gantt';
        case 'layerStack': return copy.intentLayerStack ?? 'Layer stack';
        case 'setOverlap': return copy.intentSetOverlap ?? 'Venn overlap';
        case 'rankedFunnel': return copy.intentRankedFunnel ?? 'Pyramid / funnel';
        case 'loop': return copy.intentLoop ?? 'Loop';
        case 'nested': return copy.intentNested ?? 'Nested scope';
        case 'tree': return copy.intentTree ?? 'Tree';
        case 'process': return copy.intentProcess ?? 'Process';
        case 'medallion': return copy.intentMedallion ?? 'Medallion';
        case 'highLevel': return copy.intentHighLevel ?? 'High-level overview';
        default: return type.id;
    }
}
