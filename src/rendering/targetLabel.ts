import { RenderArtifactTarget } from './types';

const RENDER_TARGET_DISPLAY_NAMES: Record<RenderArtifactTarget, string> = {
    mermaid: 'Mermaid',
    'json-canvas': 'JSON Canvas',
    'vega-lite': 'Vega-Lite',
    html: 'HTML',
    'editable-html-svg': 'Editable HTML/SVG',
    circuitikz: 'Circuitikz',
    drawio: 'Draw.io',
    drawnix: 'Drawnix'
};

export function getRenderTargetDisplayName(target: RenderArtifactTarget): string {
    return RENDER_TARGET_DISPLAY_NAMES[target] ?? target;
}
