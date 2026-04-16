import * as fs from 'fs';
import * as path from 'path';

describe('diagram documentation contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const readmePath = path.join(repoRoot, 'README.md');
    const releaseNotesPath = path.join(repoRoot, 'docs', 'releases', '1.8.2.md');
    const releaseNotesZhPath = path.join(repoRoot, 'docs', 'releases', '1.8.2.zh-CN.md');

    test('README documents HTML fallback preview, Mermaid validation, and chart template inference', () => {
        const readme = fs.readFileSync(readmePath, 'utf8');

        expect(readme).toContain('| HTML | `_diagram.html` | Yes (iframe fallback) | No | No | Yes |');
        expect(readme).toContain('Generated Mermaid artifacts are now validated with `mermaid.parse` before the renderer returns them');
        expect(readme).toContain('Invalid Mermaid artifacts now fail early with explicit validation errors before preview/export.');
        expect(readme).toContain('HTML fallback previews');
        expect(readme).toContain('planner now seeds preferred Vega-Lite chart templates');
    });

    test('1.8.2 release notes mention HTML fallback preview, Mermaid validation hardening, and chart template inference', () => {
        const releaseNotes = fs.readFileSync(releaseNotesPath, 'utf8');
        const releaseNotesZh = fs.readFileSync(releaseNotesZhPath, 'utf8');

        expect(releaseNotes).toContain('HTML diagram artifacts now have a dedicated fallback preview path');
        expect(releaseNotes).toContain('Generated Mermaid artifacts are validated before they enter preview/export flows');
        expect(releaseNotes).toContain('HTML fallback previews now follow the resolved Obsidian preview theme');
        expect(releaseNotes).toContain('planner now seeds preferred Vega-Lite chart templates');
        expect(releaseNotesZh).toContain('HTML 图表产物现在具备专门的 fallback 预览路径');
        expect(releaseNotesZh).toContain('生成的 Mermaid 产物会先通过校验，再进入预览/导出链路');
        expect(releaseNotesZh).toContain('HTML fallback 预览现在也会跟随解析后的 Obsidian 预览主题');
        expect(releaseNotesZh).toContain('规划器现在会为 Vega-Lite 图表预填首选模板');
    });
});
