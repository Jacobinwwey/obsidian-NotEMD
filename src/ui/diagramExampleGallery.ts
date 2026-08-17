import { setIcon } from 'obsidian';
import {
    getExecutableDiagramExamples,
    type DiagramExampleDefinition
} from '../diagram/examples/diagramExampleCatalog';
import {
    getExecutableDiagramType,
    type DiagramTypeFamily
} from '../diagram/diagramTypeCatalog';
import type { DiagramCatalogTypeId } from '../diagram/types';
import {
    getLocalizedDiagramFamilyLabel,
    getLocalizedDiagramIntentLabel,
    type DiagramCatalogFamilyLabelCopy,
    type DiagramCatalogLabelCopy
} from './diagramCatalogLabels';

export interface DiagramExampleGalleryCopy extends DiagramCatalogLabelCopy {
    preview: string;
    useType?: string;
    thumbnailLoading?: string;
    thumbnailUnavailable?: string;
    familyLabels: DiagramCatalogFamilyLabelCopy;
}

export function renderDiagramExampleGallery(params: {
    parent: HTMLElement;
    copy: DiagramExampleGalleryCopy;
    onPreview: (typeId: DiagramCatalogTypeId) => Promise<void>;
    onUseType?: (typeId: DiagramCatalogTypeId) => void | Promise<void>;
    renderThumbnail?: (example: DiagramExampleDefinition) => Promise<string | undefined>;
}): HTMLElement {
    const gallery = params.parent.createDiv({ cls: 'notemd-diagram-example-gallery' });
    gallery.setAttr('role', 'list');
    const examplesByFamily = new Map<DiagramTypeFamily, DiagramExampleDefinition[]>();
    getExecutableDiagramExamples().forEach(example => {
        const family = getExecutableDiagramType(example.typeId).family;
        const familyExamples = examplesByFamily.get(family) ?? [];
        familyExamples.push(example);
        examplesByFamily.set(family, familyExamples);
    });

    for (const family of ['knowledge', 'behavior', 'structure', 'quantitative', 'engineering'] as const) {
        const examples = examplesByFamily.get(family);
        if (!examples?.length) {
            continue;
        }

        const group = gallery.createDiv({ cls: 'notemd-diagram-example-family' });
        group.setAttr('role', 'group');
        group.createEl('span', {
            text: getLocalizedDiagramFamilyLabel(family, params.copy.familyLabels),
            cls: 'notemd-diagram-example-family-label'
        });

        examples.forEach(example => {
            const type = getExecutableDiagramType(example.typeId);
            const label = getLocalizedDiagramIntentLabel(type.intent, params.copy);
            const row = group.createDiv({ cls: 'notemd-diagram-example-row' });
            row.setAttr('role', 'listitem');
            const thumbnail = row.createDiv({ cls: 'notemd-diagram-example-thumbnail' });
            thumbnail.setAttr('role', 'img');
            thumbnail.setAttr('aria-label', label);
            thumbnail.setAttr('aria-busy', params.renderThumbnail ? 'true' : 'false');
            thumbnail.createEl('span', {
                text: params.copy.thumbnailLoading ?? 'Loading preview',
                cls: 'notemd-diagram-example-thumbnail-placeholder'
            });
            if (params.renderThumbnail) {
                void params.renderThumbnail(example).then(svg => {
                    if (!svg?.trim()) {
                        thumbnail.setAttr('aria-busy', 'false');
                        return;
                    }
                    thumbnail.innerHTML = svg;
                    thumbnail.setAttr('aria-busy', 'false');
                    const renderedSvg = thumbnail.querySelector('svg');
                    if (renderedSvg) {
                        renderedSvg.setAttribute('role', 'img');
                        renderedSvg.setAttribute('aria-label', label);
                    }
                }).catch(error => {
                    console.error(`Could not render diagram thumbnail "${example.typeId}":`, error);
                    thumbnail.empty();
                    thumbnail.createEl('span', {
                        text: params.copy.thumbnailUnavailable ?? 'Preview unavailable',
                        cls: 'notemd-diagram-example-thumbnail-placeholder'
                    });
                    thumbnail.setAttr('aria-busy', 'false');
                });
            }
            row.createEl('span', { text: label, cls: 'notemd-diagram-example-label' });
            const preview = row.createEl('button', { cls: 'clickable-icon notemd-diagram-example-preview' });
            preview.setAttr('type', 'button');
            preview.setAttr('data-notemd-diagram-example-type', example.typeId);
            preview.setAttr('aria-label', `${params.copy.preview}: ${label}`);
            preview.setAttr('title', params.copy.preview);
            setIcon(preview, 'eye');
            preview.addEventListener('click', () => {
                void params.onPreview(example.typeId).catch(error => {
                    console.error(`Could not render diagram example "${example.typeId}":`, error);
                });
            });
            if (params.onUseType) {
                const use = row.createEl('button', { cls: 'clickable-icon notemd-diagram-example-use' });
                use.setAttr('type', 'button');
                use.setAttr('data-notemd-diagram-example-use', example.typeId);
                use.setAttr('aria-label', `${params.copy.useType ?? 'Use diagram type'}: ${label}`);
                use.setAttr('title', params.copy.useType ?? 'Use diagram type');
                setIcon(use, 'check');
                use.addEventListener('click', () => {
                    void params.onUseType?.(example.typeId);
                });
            }
        });
    }

    return gallery;
}
