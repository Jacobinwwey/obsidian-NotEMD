import * as fs from 'fs';
import * as path from 'path';

describe('chapter split docs contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const chapterSplitDocPath = path.join(repoRoot, 'docs', 'chapter-split-toc.md');
    const chapterSplitDocZhPath = path.join(repoRoot, 'docs', 'chapter-split-toc.zh-CN.md');
    const docsIndexPath = path.join(repoRoot, 'docs', 'index.md');
    const docsIndexZhPath = path.join(repoRoot, 'docs', 'index.zh-CN.md');
    const docsReadmePath = path.join(repoRoot, 'docs', 'README.md');
    const docsReadmeZhPath = path.join(repoRoot, 'docs', 'README.zh-CN.md');

    test('release-facing chapter split spotlight docs stay aligned with current managed-artifact semantics', () => {
        const doc = fs.readFileSync(chapterSplitDocPath, 'utf8');
        const docZh = fs.readFileSync(chapterSplitDocZhPath, 'utf8');

        for (const content of [doc, docZh]) {
            expect(content).toContain('Platform_TOC.md');
            expect(content).toContain('.notemd-chapter-split.json');
            expect(content).toContain('notemdArtifactKind: "chapter-split-toc"');
            expect(content).toContain('requestedSplitHeadingLevel: "auto"');
            expect(content).toContain('resolvedSplitHeadingLevel: 2');
            expect(content).toContain('chapterCount: 2');
            expect(content).toContain('[[Docs/Platform_chapters/01-overview#^notemd-scope|Scope]]');
        }

        expect(doc).toContain('deterministic front-matter metadata');
        expect(doc).toContain('Stable nested-heading block references such as `#^notemd-scope`');
        expect(doc).toContain('Manifest-backed rerun safety and stale generated-file cleanup');
        expect(doc).toContain('if you force `H3` and the note has no `H3`, the operation fails instead of silently guessing');

        expect(docZh).toContain('TOC 带 front matter');
        expect(docZh).toContain('稳定 block ref，例如 `#^notemd-scope`');
        expect(docZh).toContain('再次执行时会清理陈旧产物');
        expect(docZh).toContain('不会直接覆盖');
    });

    test('docs hub surfaces keep the chapter split spotlight docs visible in both languages', () => {
        const docsIndex = fs.readFileSync(docsIndexPath, 'utf8');
        const docsIndexZh = fs.readFileSync(docsIndexZhPath, 'utf8');
        const docsReadme = fs.readFileSync(docsReadmePath, 'utf8');
        const docsReadmeZh = fs.readFileSync(docsReadmeZhPath, 'utf8');

        expect(docsIndex).toContain('[Chapter Split + TOC (EN)](./chapter-split-toc.md)');
        expect(docsIndex).toContain('[Chapter Split + TOC (zh-CN)](./chapter-split-toc.zh-CN.md)');
        expect(docsIndexZh).toContain('[章节拆分 + TOC（英文）](./chapter-split-toc.md)');
        expect(docsIndexZh).toContain('[章节拆分 + TOC（中文）](./chapter-split-toc.zh-CN.md)');
        expect(docsReadme).toContain('[Chapter Split + TOC Extraction](./chapter-split-toc.md)');
        expect(docsReadmeZh).toContain('[章节拆分 + TOC 提取](./chapter-split-toc.zh-CN.md)');
    });
});
