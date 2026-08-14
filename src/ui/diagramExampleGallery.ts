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
    familyLabels: DiagramCatalogFamilyLabelCopy;
}

export function renderDiagramExampleGallery(params: {
    parent: HTMLElement;
    copy: DiagramExampleGalleryCopy;
    onPreview: (typeId: DiagramCatalogTypeId) => Promise<void>;
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
        });
    }

    return gallery;
}
