import type { RenderTarget } from '../diagram/types';

/** Image formats produced from a target's deterministic preview SVG. */
export const DIAGRAM_EXPORT_FORMATS = ['svg', 'png', 'pdf'] as const;
export type DiagramExportFormat = typeof DIAGRAM_EXPORT_FORMATS[number];

export type RenderTargetPreviewKind = 'iframe' | 'svg-companion' | 'source-only';
export type RenderTargetConsumerGate = 'none' | 'manual' | 'native-compile';
export type RenderTargetFallbackPolicy = 'strict' | 'explicit';

export interface RenderTargetDescriptor {
    target: RenderTarget;
    /** Stable renderer registry id. Keeping this equal to target avoids alias drift. */
    rendererId: string;
    mimeType: string;
    /** Extension for the raw source artifact saved from the preview modal. */
    sourceExtension: string;
    /** Extension used by the Obsidian vault save path, when the host wraps source. */
    vaultExtension: string;
    previewKind: RenderTargetPreviewKind;
    exportFormats: readonly DiagramExportFormat[];
    consumerGate: RenderTargetConsumerGate;
    fallbackPolicy: RenderTargetFallbackPolicy;
}

const IMAGE_EXPORTS: readonly DiagramExportFormat[] = [...DIAGRAM_EXPORT_FORMATS];

export const RENDER_TARGET_DESCRIPTORS: readonly RenderTargetDescriptor[] = [
    {
        target: 'mermaid',
        rendererId: 'mermaid',
        mimeType: 'text/vnd.mermaid',
        sourceExtension: '.md',
        vaultExtension: '.md',
        previewKind: 'iframe',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'none',
        fallbackPolicy: 'strict'
    },
    {
        target: 'json-canvas',
        rendererId: 'json-canvas',
        mimeType: 'application/json',
        sourceExtension: '.canvas',
        vaultExtension: '.canvas',
        previewKind: 'iframe',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'none',
        fallbackPolicy: 'strict'
    },
    {
        target: 'vega-lite',
        rendererId: 'vega-lite',
        mimeType: 'application/json',
        sourceExtension: '.json',
        // Generation writes a readable markdown fence; the preview modal saves raw JSON.
        vaultExtension: '.md',
        previewKind: 'iframe',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'none',
        fallbackPolicy: 'strict'
    },
    {
        target: 'html',
        rendererId: 'html',
        mimeType: 'text/html',
        sourceExtension: '.html',
        vaultExtension: '.html',
        previewKind: 'iframe',
        exportFormats: [],
        consumerGate: 'none',
        fallbackPolicy: 'explicit'
    },
    {
        target: 'editable-html-svg',
        rendererId: 'editable-html-svg',
        mimeType: 'text/html',
        sourceExtension: '.html',
        vaultExtension: '.html',
        previewKind: 'svg-companion',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'none',
        fallbackPolicy: 'strict'
    },
    {
        target: 'drawio',
        rendererId: 'drawio',
        mimeType: 'application/vnd.jgraph.mxfile',
        sourceExtension: '.drawio',
        vaultExtension: '.drawio',
        previewKind: 'svg-companion',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'manual',
        fallbackPolicy: 'strict'
    },
    {
        target: 'drawnix',
        rendererId: 'drawnix',
        mimeType: 'application/vnd.drawnix+json',
        sourceExtension: '.drawnix',
        vaultExtension: '.drawnix',
        previewKind: 'svg-companion',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'manual',
        fallbackPolicy: 'strict'
    },
    {
        target: 'circuitikz',
        rendererId: 'circuitikz',
        mimeType: 'text/x-tex',
        sourceExtension: '.tex',
        vaultExtension: '.tex',
        previewKind: 'svg-companion',
        exportFormats: IMAGE_EXPORTS,
        consumerGate: 'native-compile',
        fallbackPolicy: 'strict'
    }
] as const;

const DESCRIPTOR_BY_TARGET = new Map(RENDER_TARGET_DESCRIPTORS.map(descriptor => [descriptor.target, descriptor]));

function assertRenderTargetCatalog(): void {
    if (DESCRIPTOR_BY_TARGET.size !== RENDER_TARGET_DESCRIPTORS.length) {
        throw new Error('Render target descriptors must use unique target identifiers.');
    }
    for (const descriptor of RENDER_TARGET_DESCRIPTORS) {
        if (!descriptor.sourceExtension.startsWith('.') || !descriptor.vaultExtension.startsWith('.')) {
            throw new Error(`Render target "${descriptor.target}" has an invalid source extension.`);
        }
        if (descriptor.exportFormats.some(format => !DIAGRAM_EXPORT_FORMATS.includes(format))) {
            throw new Error(`Render target "${descriptor.target}" advertises an unknown export format.`);
        }
    }
}

assertRenderTargetCatalog();

export function listRenderTargetDescriptors(): readonly RenderTargetDescriptor[] {
    return RENDER_TARGET_DESCRIPTORS;
}

export function getRenderTargetDescriptor(target: RenderTarget): RenderTargetDescriptor {
    const descriptor = DESCRIPTOR_BY_TARGET.get(target);
    if (!descriptor) {
        throw new Error(`Unsupported render target "${String(target)}".`);
    }
    return descriptor;
}

export function isDiagramExportFormat(value: unknown): value is DiagramExportFormat {
    return typeof value === 'string'
        && (DIAGRAM_EXPORT_FORMATS as readonly string[]).includes(value);
}
