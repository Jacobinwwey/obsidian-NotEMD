import { setIcon } from 'obsidian';
import {
    getDiagramCapabilityManifest,
    type DiagramReferencePreview,
    type ReferenceOnlyDiagramLayout
} from '../diagram/diagramCapabilityManifest';
import {
    getExecutableDiagramExamples,
    type DiagramExampleDefinition
} from '../diagram/examples/diagramExampleCatalog';
import {
    getExecutableDiagramType,
    type DiagramTypeFamily
} from '../diagram/diagramTypeCatalog';
import type { DiagramCatalogTypeId } from '../diagram/types';
import { getRenderTargetDisplayName } from '../rendering/targetLabel';
import { getRenderTargetDescriptor } from '../rendering/renderTargetCatalog';
import {
    getLocalizedDiagramFamilyLabel,
    getLocalizedDiagramIntentLabel,
    type DiagramCatalogFamilyLabelCopy,
    type DiagramCatalogLabelCopy
} from './diagramCatalogLabels';

export interface DiagramCapabilityGalleryCopy extends DiagramCatalogLabelCopy {
    shippedSection: string;
    referenceOnlySection: string;
    shippedStatus: string;
    referenceOnlyStatus: string;
    preview: string;
    referencePreview: string;
    useType: string;
    openReference: string;
    thumbnailLoading: string;
    thumbnailUnavailable: string;
    referenceUnavailable: string;
    targetPrefix: string;
    formatsPrefix: string;
    sourcePrefix: string;
    familyLabels: DiagramCatalogFamilyLabelCopy;
}

export interface DiagramCapabilityGalleryParams {
    parent: HTMLElement;
    copy: DiagramCapabilityGalleryCopy;
    locale?: string;
    onPreview: (typeId: DiagramCatalogTypeId) => Promise<void>;
    onUseType?: (typeId: DiagramCatalogTypeId) => void | Promise<void>;
    onPreviewReference?: (referenceId: string) => Promise<void>;
    renderThumbnail?: (example: DiagramExampleDefinition) => Promise<string | undefined>;
    resolveReferenceAsset?: (assetId: string) => string | undefined;
}

const DIAGRAM_FAMILIES: readonly DiagramTypeFamily[] = [
    'knowledge',
    'behavior',
    'structure',
    'quantitative',
    'engineering'
];

function isChineseLocale(locale: string | undefined): boolean {
    return locale?.toLowerCase().startsWith('zh') ?? false;
}

function getReferenceLabel(reference: DiagramReferencePreview, locale: string | undefined): string {
    return isChineseLocale(locale) ? reference.labelZh : reference.label;
}

function renderReferenceImage(
    parent: HTMLElement,
    reference: DiagramReferencePreview,
    label: string,
    copy: DiagramCapabilityGalleryCopy,
    resolveReferenceAsset?: (assetId: string) => string | undefined
): boolean {
    const asset = resolveReferenceAsset?.(reference.previewAssetId);
    if (!asset) {
        parent.createEl('span', {
            text: copy.referenceUnavailable,
            cls: 'notemd-diagram-capability-reference-placeholder'
        });
        return false;
    }

    const image = parent.createEl('img', {
        cls: 'notemd-diagram-capability-reference-image',
        attr: {
            src: asset,
            alt: `${copy.referencePreview}: ${label}`,
            loading: 'lazy',
            decoding: 'async'
        }
    });
    image.setAttr('data-notemd-diagram-reference-id', reference.id);
    return true;
}

function renderProductionThumbnail(
    parent: HTMLElement,
    example: DiagramExampleDefinition,
    label: string,
    copy: DiagramCapabilityGalleryCopy,
    renderThumbnail?: (example: DiagramExampleDefinition) => Promise<string | undefined>
): void {
    parent.setAttr('role', 'img');
    parent.setAttr('aria-label', label);
    parent.setAttr('aria-busy', renderThumbnail ? 'true' : 'false');
    parent.createEl('span', {
        text: copy.thumbnailLoading,
        cls: 'notemd-diagram-capability-thumbnail-placeholder'
    });
    if (!renderThumbnail) {
        return;
    }

    void renderThumbnail(example).then(svg => {
        if (!svg?.trim()) {
            parent.setAttr('aria-busy', 'false');
            return;
        }
        parent.innerHTML = svg;
        parent.setAttr('aria-busy', 'false');
        const renderedSvg = parent.querySelector('svg');
        if (renderedSvg) {
            renderedSvg.setAttribute('role', 'img');
            renderedSvg.setAttribute('aria-label', label);
        }
    }).catch(error => {
        console.error(`Could not render diagram capability thumbnail "${example.typeId}":`, error);
        parent.empty();
        parent.createEl('span', {
            text: copy.thumbnailUnavailable,
            cls: 'notemd-diagram-capability-thumbnail-placeholder'
        });
        parent.setAttr('aria-busy', 'false');
    });
}

function addPreviewButton(
    parent: HTMLElement,
    label: string,
    ariaLabel: string,
    className: string,
    onClick: () => void
): HTMLButtonElement {
    const button = parent.createEl('button', { cls: `clickable-icon ${className}` });
    button.setAttr('type', 'button');
    button.setAttr('aria-label', ariaLabel);
    button.setAttr('title', ariaLabel);
    button.setAttr('data-notemd-diagram-capability-action', label);
    setIcon(button, 'eye');
    button.addEventListener('click', onClick);
    return button;
}

function renderShippedRow(
    parent: HTMLElement,
    typeId: DiagramCatalogTypeId,
    params: DiagramCapabilityGalleryParams,
    examplesByType: ReadonlyMap<DiagramCatalogTypeId, DiagramExampleDefinition>,
    referencesById: ReadonlyMap<string, DiagramReferencePreview>,
    referencePreviewId?: string
): void {
    const type = getExecutableDiagramType(typeId);
    const example = examplesByType.get(typeId);
    if (!example) {
        return;
    }

    const label = getLocalizedDiagramIntentLabel(type.intent, params.copy);
    const row = parent.createDiv({ cls: 'notemd-diagram-capability-row' });
    row.setAttr('role', 'listitem');
    row.setAttr('data-notemd-diagram-capability-type', type.id);
    const visuals = row.createDiv({ cls: 'notemd-diagram-capability-visuals' });
    const production = visuals.createDiv({ cls: 'notemd-diagram-capability-visual notemd-diagram-capability-production' });
    production.createEl('span', { text: params.copy.shippedStatus, cls: 'notemd-diagram-capability-visual-label' });
    renderProductionThumbnail(production.createDiv({ cls: 'notemd-diagram-capability-thumbnail notemd-diagram-example-thumbnail' }), example, label, params.copy, params.renderThumbnail);

    const reference = getDiagramReferenceForType(referencePreviewId, referencesById);
    if (reference) {
        const referenceLabel = getReferenceLabel(reference, params.locale);
        const referenceVisual = visuals.createDiv({ cls: 'notemd-diagram-capability-visual notemd-diagram-capability-reference' });
        referenceVisual.createEl('span', { text: params.copy.referencePreview, cls: 'notemd-diagram-capability-visual-label' });
        renderReferenceImage(referenceVisual.createDiv({ cls: 'notemd-diagram-capability-thumbnail' }), reference, referenceLabel, params.copy, params.resolveReferenceAsset);
    }

    const details = row.createDiv({ cls: 'notemd-diagram-capability-details' });
    details.createEl('span', { text: label, cls: 'notemd-diagram-capability-label' });
    const descriptor = getRenderTargetDescriptor(type.defaultTarget);
    details.createEl('span', {
        text: `${params.copy.targetPrefix}: ${getRenderTargetDisplayName(type.defaultTarget)}`,
        cls: 'notemd-diagram-capability-meta'
    });
    details.createEl('span', {
        text: `${params.copy.formatsPrefix}: ${descriptor.exportFormats.length > 0 ? descriptor.exportFormats.join(', ').toUpperCase() : 'source'}`,
        cls: 'notemd-diagram-capability-meta'
    });
    const actions = details.createDiv({ cls: 'notemd-diagram-capability-actions' });
    const productionPreviewButton = addPreviewButton(actions, 'production-preview', `${params.copy.preview}: ${label}`, 'notemd-diagram-capability-preview', () => {
        void params.onPreview(type.id).catch(error => console.error(`Could not preview diagram "${type.id}":`, error));
    });
    productionPreviewButton.setAttr('data-notemd-diagram-example-type', type.id);
    if (reference && params.onPreviewReference) {
        const referenceLabel = getReferenceLabel(reference, params.locale);
        addPreviewButton(actions, 'reference-preview', `${params.copy.openReference}: ${referenceLabel}`, 'notemd-diagram-capability-reference-preview', () => {
            void params.onPreviewReference?.(reference.id).catch(error => console.error(`Could not preview reference "${reference.id}":`, error));
        });
    }
    if (params.onUseType) {
        const use = actions.createEl('button', { cls: 'clickable-icon notemd-diagram-capability-use notemd-diagram-example-use' });
        use.setAttr('type', 'button');
        use.setAttr('aria-label', `${params.copy.useType}: ${label}`);
        use.setAttr('title', params.copy.useType);
        use.setAttr('data-notemd-diagram-capability-use', type.id);
        use.setAttr('data-notemd-diagram-example-use', type.id);
        setIcon(use, 'check');
        use.addEventListener('click', () => {
            void params.onUseType?.(type.id);
        });
    }
}

function getDiagramReferenceForType(
    referencePreviewId: string | undefined,
    referencesById: ReadonlyMap<string, DiagramReferencePreview>
): DiagramReferencePreview | undefined {
    return referencePreviewId ? referencesById.get(referencePreviewId) : undefined;
}

function renderReferenceOnlyRow(
    parent: HTMLElement,
    layout: ReferenceOnlyDiagramLayout,
    params: DiagramCapabilityGalleryParams
): void {
    const label = getReferenceLabel(layout, params.locale);
    const row = parent.createDiv({ cls: 'notemd-diagram-capability-row is-reference-only' });
    row.setAttr('role', 'listitem');
    row.setAttr('data-notemd-diagram-reference-layout', layout.id);
    const visual = row.createDiv({ cls: 'notemd-diagram-capability-visual notemd-diagram-capability-reference' });
    visual.createEl('span', { text: params.copy.referenceOnlyStatus, cls: 'notemd-diagram-capability-visual-label' });
    renderReferenceImage(visual.createDiv({ cls: 'notemd-diagram-capability-thumbnail' }), layout, label, params.copy, params.resolveReferenceAsset);

    const details = row.createDiv({ cls: 'notemd-diagram-capability-details' });
    details.createEl('span', { text: label, cls: 'notemd-diagram-capability-label' });
    details.createEl('span', {
        text: `${params.copy.sourcePrefix}: ${layout.referencePath}`,
        cls: 'notemd-diagram-capability-meta'
    });
    const actions = details.createDiv({ cls: 'notemd-diagram-capability-actions' });
    if (params.onPreviewReference) {
        addPreviewButton(actions, 'reference-preview', `${params.copy.openReference}: ${label}`, 'notemd-diagram-capability-reference-preview', () => {
            void params.onPreviewReference?.(layout.id).catch(error => console.error(`Could not preview reference "${layout.id}":`, error));
        });
    }
}

export function renderDiagramCapabilityGallery(params: DiagramCapabilityGalleryParams): HTMLElement {
    const gallery = params.parent.createDiv({ cls: 'notemd-diagram-capability-gallery notemd-diagram-example-gallery' });
    gallery.setAttr('role', 'list');
    const manifest = getDiagramCapabilityManifest();
    const referencesById = new Map(manifest.referencePreviews.map(reference => [reference.id, reference]));
    const examplesByType = new Map(getExecutableDiagramExamples().map(example => [example.typeId, example]));

    gallery.createEl('h4', { text: params.copy.shippedSection, cls: 'notemd-diagram-capability-section-title' });
    for (const family of DIAGRAM_FAMILIES) {
        const types = manifest.shippedTypes.filter(type => type.family === family);
        if (types.length === 0) {
            continue;
        }
        const group = gallery.createDiv({ cls: 'notemd-diagram-capability-family' });
        group.createEl('span', {
            text: getLocalizedDiagramFamilyLabel(family, params.copy.familyLabels),
            cls: 'notemd-diagram-capability-family-label'
        });
        const list = group.createDiv({ cls: 'notemd-diagram-capability-family-list' });
        for (const type of types) {
            renderShippedRow(list, type.id, params, examplesByType, referencesById, type.referencePreviewId);
        }
    }

    gallery.createEl('h4', { text: params.copy.referenceOnlySection, cls: 'notemd-diagram-capability-section-title' });
    const referenceList = gallery.createDiv({ cls: 'notemd-diagram-capability-reference-list' });
    for (const layout of manifest.referenceOnlyLayouts) {
        renderReferenceOnlyRow(referenceList, layout, params);
    }
    return gallery;
}
