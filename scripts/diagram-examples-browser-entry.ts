import type { RenderArtifact } from '../src/rendering/types';
import { renderJsonCanvasArtifactSvg } from '../src/rendering/preview/canvasPreview';
import { renderMermaidArtifactSvg } from '../src/rendering/preview/mermaidPreview';
import { renderVegaLiteArtifactSvg } from '../src/rendering/preview/vegaLitePreview';
import {
    getBundledMermaidPreviewDeps,
    getBundledVegaLitePreviewDeps
} from '../src/rendering/webview/bundledPreviewDeps';
import { assertMountedSvgPresentationSafety } from '../src/rendering/preview/svgSafety';

async function renderArtifactPreviewSvg(artifact: RenderArtifact): Promise<string> {
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
            throw new Error(`Diagram example target "${artifact.target}" has no browser SVG preview adapter.`);
    }
}

function assertPreviewSvgPresentationSafety(svg: string, source: string): void {
    const mount = document.createElement('div');
    mount.style.cssText = 'position:absolute;left:-100000px;top:0;width:960px;height:540px;overflow:hidden;';
    mount.innerHTML = svg;
    const renderedSvg = mount.querySelector('svg');
    if (renderedSvg) {
        renderedSvg.style.display = 'block';
        renderedSvg.style.width = '100%';
        renderedSvg.style.height = '100%';
        renderedSvg.style.maxWidth = 'none';
    }
    document.body.appendChild(mount);
    try {
        assertMountedSvgPresentationSafety(mount, source);
    } finally {
        mount.remove();
    }
}

(window as unknown as {
    __NOTEMD_DIAGRAM_EXAMPLES_PREVIEW__: {
        render: typeof renderArtifactPreviewSvg;
        assertPresentationSafety: typeof assertPreviewSvgPresentationSafety;
    };
}).__NOTEMD_DIAGRAM_EXAMPLES_PREVIEW__ = {
    render: renderArtifactPreviewSvg,
    assertPresentationSafety: assertPreviewSvgPresentationSafety
};
