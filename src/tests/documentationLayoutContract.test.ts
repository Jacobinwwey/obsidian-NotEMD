import * as fs from 'fs';
import * as path from 'path';

describe('documentation layout contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');

    function readFile(relativePath: string): string {
        return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    }

    test('root documentation index points to the canonical docs hub and archive', () => {
        const index = readFile('DOCUMENTATION_INDEX.md');

        expect(index).toContain('thin root-level entrypoint');
        expect(index).toContain('[docs/README.md](docs/README.md)');
        expect(index).toContain('[docs/archive/README.md](docs/archive/README.md)');
        expect(index).toContain('root-history');
        expect(index).toContain('Root-level Markdown should now be limited');
    });

    test('docs hubs expose the repository layout rule and archive entrypoint in both languages', () => {
        const docsReadme = readFile('docs/README.md');
        const docsReadmeZh = readFile('docs/README.zh-CN.md');

        expect(docsReadme).toContain('Repository Documentation Layout');
        expect(docsReadme).toContain('Documentation Archive');
        expect(docsReadmeZh).toContain('仓库文档布局规则');
        expect(docsReadmeZh).toContain('文档归档区');
        expect(docsReadme).toContain('root-history');
        expect(docsReadmeZh).toContain('root-history');
    });

    test('repository layout rule keeps historical root reports in docs/archive/root-history', () => {
        const layout = readFile('docs/maintainer/repository-document-layout.md');
        const layoutZh = readFile('docs/maintainer/repository-document-layout.zh-CN.md');
        const archiveReadme = readFile('docs/archive/README.md');
        const archiveReadmeZh = readFile('docs/archive/README.zh-CN.md');

        expect(layout).toContain('docs/archive/root-history/');
        expect(layoutZh).toContain('docs/archive/root-history/');
        expect(archiveReadme).toContain('historical or one-off');
        expect(archiveReadmeZh).toContain('历史性或一次性');
    });

    test('historical one-off root docs were moved out of the repository root', () => {
        const movedFiles = [
            'BACKUP_CONFIRMATION.md',
            'BUNDLE_SCRIPTS_README.md',
            'CHANGELOG_STANDALONE_BUNDLE.md',
            'COMPLETE_SOLUTION_SUMMARY.md',
            'CONTRIBUTOR_ANALYSIS_REPORT.md',
            'CSS_PRELOAD_FIX.md',
            'DEVELOPMENT_PHASE_COMPLETION.md',
            'EXTERNAL_PRELOAD_BUG_FIX.md',
            'FINAL_STATUS_CONTRIBUTOR_CLEANUP.md',
            'GIT_AUTHOR_HYGIENE.md',
            'GIT_AUTHOR_HYGIENE_STATUS.md',
            'GITHUB_SUPPORT_REQUEST_TEMPLATE.md',
            'PROGRESS_SINCE_1.9.2.md',
            'ROOT_CAUSE_CLAUDE_CONTRIBUTOR.md',
            'SUMMARY.md',
            'WORK_SUMMARY_2026-06-23.md',
        ];

        for (const filename of movedFiles) {
            expect(fs.existsSync(path.join(repoRoot, filename))).toBe(false);
            expect(fs.existsSync(path.join(repoRoot, 'docs', 'archive', 'root-history', filename))).toBe(true);
        }

        expect(fs.existsSync(path.join(repoRoot, 'GEO_ROADMAP.md'))).toBe(true);
        expect(fs.existsSync(path.join(repoRoot, 'DOCUMENTATION_INDEX.md'))).toBe(true);
    });

    test('canonical progress audit records the repository-layout alignment closure in both languages', () => {
        const progress = readFile('docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md');
        const progressZh = readFile('docs/brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md');

        expect(progress).toContain('## 5.2 2026-07-03 Repository doc truth/layout alignment');
        expect(progressZh).toContain('## 5.2 2026-07-03 仓库文档真值 / 布局对齐');
        expect(progress).toContain('docs/archive/root-history/');
        expect(progressZh).toContain('docs/archive/root-history/');
        expect(progress).toContain('DOCUMENTATION_INDEX.md');
        expect(progressZh).toContain('DOCUMENTATION_INDEX.md');
    });
});
