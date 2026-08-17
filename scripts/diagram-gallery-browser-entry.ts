import {
    getExecutableDiagramExamples,
    renderExecutableDiagramExample
} from '../src/diagram/examples/diagramExampleCatalog';
import { getExecutableDiagramType } from '../src/diagram/diagramTypeCatalog';
import { createDefaultDiagramRendererService } from '../src/diagram/diagramGenerationService';
import type { RenderArtifact } from '../src/rendering/types';
import { renderJsonCanvasArtifactSvg } from '../src/rendering/preview/canvasPreview';
import { renderMermaidArtifactSvg } from '../src/rendering/preview/mermaidPreview';
import { renderVegaLiteArtifactSvg } from '../src/rendering/preview/vegaLitePreview';
import {
    getBundledMermaidPreviewDeps,
    getBundledVegaLitePreviewDeps
} from '../src/rendering/webview/bundledPreviewDeps';

export interface RenderedDiagramGalleryEntry {
    typeId: string;
    fixtureId: string;
    title: string;
    target: string;
    previewTarget: string;
    svg: string;
}

async function renderArtifactSvg(artifact: RenderArtifact): Promise<string> {
    if (artifact.previewSvg?.content?.trim()) {
        return artifact.previewSvg.content;
    }
    switch (artifact.target) {
        case 'mermaid':
            return renderMermaidArtifactSvg(artifact, getBundledMermaidPreviewDeps(), 'light');
        case 'json-canvas':
            return renderJsonCanvasArtifactSvg(artifact, 'light');
        case 'vega-lite':
            return renderVegaLiteArtifactSvg(
                artifact,
                async () => getBundledVegaLitePreviewDeps(),
                'light'
            );
        default:
            throw new Error(`Gallery target "${artifact.target}" does not expose an SVG preview.`);
    }
}

function makeSvgAccessible(svg: string, fixtureId: string, title: string, description: string): string {
    const documentNode = new DOMParser().parseFromString(svg, 'image/svg+xml');
    if (documentNode.querySelector('parsererror') || documentNode.documentElement.tagName.toLowerCase() !== 'svg') {
        throw new Error(`Gallery fixture "${fixtureId}" returned malformed SVG.`);
    }

    const root = documentNode.documentElement;
    const dynamicPreviewId = /notemd-preview-\d+-[a-z0-9]+/g;
    const stablePreviewId = `notemd-gallery-${fixtureId}`;
    for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
        for (const attribute of Array.from(element.attributes)) {
            if (dynamicPreviewId.test(attribute.value)) {
                element.setAttribute(attribute.name, attribute.value.replace(dynamicPreviewId, stablePreviewId));
            }
            dynamicPreviewId.lastIndex = 0;
        }
    }
    const textWalker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode = textWalker.nextNode();
    while (textNode) {
        if (dynamicPreviewId.test(textNode.nodeValue ?? '')) {
            textNode.nodeValue = (textNode.nodeValue ?? '').replace(dynamicPreviewId, stablePreviewId);
        }
        dynamicPreviewId.lastIndex = 0;
        textNode = textWalker.nextNode();
    }

    const titleId = `notemd-gallery-${fixtureId}-title`;
    const descriptionId = `notemd-gallery-${fixtureId}-desc`;
    const titleNode = root.querySelector('title')
        ?? documentNode.createElementNS('http://www.w3.org/2000/svg', 'title');
    const descriptionNode = root.querySelector('desc')
        ?? documentNode.createElementNS('http://www.w3.org/2000/svg', 'desc');
    titleNode.id = titleId;
    titleNode.textContent = title;
    descriptionNode.id = descriptionId;
    descriptionNode.textContent = description;
    if (!titleNode.parentNode) {
        root.insertBefore(titleNode, root.firstChild);
    }
    if (!descriptionNode.parentNode) {
        root.insertBefore(descriptionNode, titleNode.nextSibling);
    }
    root.setAttribute('role', 'img');
    root.setAttribute('aria-labelledby', `${titleId} ${descriptionId}`);
    // Normalize serializer whitespace so generated gallery assets stay diff-clean and deterministic.
    return new XMLSerializer().serializeToString(root).replace(/[ \t]+(?=\r?\n|$)/g, '');
}

async function renderGallery(): Promise<RenderedDiagramGalleryEntry[]> {
    const renderer = createDefaultDiagramRendererService();
    const entries: RenderedDiagramGalleryEntry[] = [];
    for (const example of getExecutableDiagramExamples()) {
        const type = getExecutableDiagramType(example.typeId);
        const artifact = await renderExecutableDiagramExample(example, renderer);
        const previewArtifact = artifact.target === 'mermaid'
            ? await renderer.render(example.spec, { target: 'editable-html-svg' })
            : artifact;
        const svg = makeSvgAccessible(
            await renderArtifactSvg(previewArtifact),
            example.fixtureId,
            example.title,
            example.selectionRationale
        );
        entries.push({
            typeId: example.typeId,
            fixtureId: example.fixtureId,
            title: example.title,
            target: type.defaultTarget,
            previewTarget: previewArtifact.target,
            svg
        });
    }
    return entries;
}

(window as unknown as {
    __NOTEMD_DIAGRAM_GALLERY__: { render: typeof renderGallery };
}).__NOTEMD_DIAGRAM_GALLERY__ = { render: renderGallery };
