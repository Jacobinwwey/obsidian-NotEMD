import { RenderTarget } from '../diagram/types';

const RENDER_TARGET_DISPLAY_NAMES: Record<RenderTarget, string> = {
    mermaid: 'Mermaid',
    'json-canvas': 'JSON Canvas',
    'vega-lite': 'Vega-Lite',
    html: 'HTML',
    'editable-html-svg': 'Editable HTML/SVG'
};

export function getRenderTargetDisplayName(target: RenderTarget): string {
    return RENDER_TARGET_DISPLAY_NAMES[target] ?? target;
}
