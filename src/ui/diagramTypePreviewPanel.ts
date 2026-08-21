import { getExecutableDiagramExamples } from '../diagram/examples/diagramExampleCatalog';
import {
    getExecutableDiagramType,
    type ExecutableDiagramTypeDefinition
} from '../diagram/diagramTypeCatalog';
import type { DiagramCatalogTypeId } from '../diagram/types';
import { getRenderTargetDisplayName } from '../rendering/targetLabel';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';
import type { DiagramCatalogLabelCopy } from './diagramCatalogLabels';

export interface DiagramTypePreviewPanelCopy extends DiagramCatalogLabelCopy {
    title: string;
    empty: string;
    loading: string;
    unavailable: string;
    failed: string;
    targetPrefix: string;
    formatsPrefix: string;
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
    const example = getExecutableDiagramExamples().find(candidate => candidate.sourceIntent === intent);
    return example?.typeId;
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

            const label = getLocalizedTypeLabel(type.intent, params.copy);
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
                setPreviewState('ready', false);
                const renderedSvg = canvas.querySelector('svg');
                if (renderedSvg) {
                    renderedSvg.setAttribute('role', 'img');
                    renderedSvg.setAttribute('aria-label', label);
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

function getLocalizedTypeLabel(intent: string, copy: DiagramCatalogLabelCopy): string {
    switch (intent) {
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
        default: return intent;
    }
}
