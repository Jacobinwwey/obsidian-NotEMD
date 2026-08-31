import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..');

describe('diagram type preview host layout contract', () => {
    test('fits native SVGs into a proportional thumbnail without horizontal scrolling', () => {
        const styles = fs.readFileSync(path.join(repoRoot, 'styles.css'), 'utf8');
        const panelSource = fs.readFileSync(path.join(repoRoot, 'src', 'ui', 'diagramTypePreviewPanel.ts'), 'utf8');
        const canvasBlock = styles.match(/\.notemd-diagram-type-preview-canvas\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

        expect(canvasBlock).toContain('overflow: hidden');
        expect(canvasBlock).not.toContain('aspect-ratio: 16 / 9');
        expect(panelSource).toContain('data-preview-aspect-ratio');
        expect(panelSource).not.toContain('data-preview-min-readable-width');
        expect(styles).toContain('max-width: 100%;');
        expect(styles).toContain('min-width: 0;');
    });
});
