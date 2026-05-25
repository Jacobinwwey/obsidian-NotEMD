import * as path from 'path';

const repoRoot = path.join(__dirname, '..', '..');
const helperPath = path.join(repoRoot, 'scripts', 'lib', 'repo-saga-contributor-normalization.js');

describe('repo-saga contributor normalization', () => {
    const {
        countCanonicalHumanContributorsFromShortlog,
        rewriteRepoSagaContributorCountsInSvg
    } = require(helperPath) as {
        countCanonicalHumanContributorsFromShortlog: (shortlogSource: string) => number;
        rewriteRepoSagaContributorCountsInSvg: (
            svgSource: string,
            stats: {
                summary: {
                    rangeStartLabel: string;
                    rangeEndLabel: string;
                    commitCount: number;
                    contributorCount: number;
                    tagCount: number;
                };
                quarters: Array<{
                    label: string;
                    commitCount: number;
                    contributorCount: number;
                }>;
            }
        ) => string;
    };

    test('collapses same-email aliases and excludes bot identities from human contributor counts', () => {
        const shortlog = [
            '   498 Jacobinwwey <jacob.hxx.cn@outlook.com>',
            '    72 aliyun1121003339 <jacob.hxx.cn@outlook.com>',
            '     5 github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>',
            '     2 google-labs-jules[bot] <161369871+google-labs-jules[bot]@users.noreply.github.com>',
            '     9 Another Human <another@example.com>'
        ].join('\n');

        expect(countCanonicalHumanContributorsFromShortlog(shortlog)).toBe(2);
    });

    test('rewrites only contributor counts inside repo-saga summary and quarter stat lines', () => {
        const svg = [
            '<svg>',
            '  <text x="800" y="142">2025 Q2 — 2026 Q2  ·  550 commits  ·  3 contributors  ·  43 tags</text>',
            '  <text x="182" y="526">2025 Q2: 77 commits, 1 contributors, +37,089 / -14,982 lines. Defining moments: TypeScript Invasion.</text>',
            '  <text x="182" y="766">2025 Q3: 57 commits, 2 contributors, +15,137 / -14,179 lines. Defining moments: Release Empire.</text>',
            '</svg>'
        ].join('\n');

        const rewritten = rewriteRepoSagaContributorCountsInSvg(svg, {
            summary: {
                rangeStartLabel: '2025 Q2',
                rangeEndLabel: '2026 Q2',
                commitCount: 550,
                contributorCount: 1,
                tagCount: 43
            },
            quarters: [
                { label: '2025 Q2', commitCount: 77, contributorCount: 1 },
                { label: '2025 Q3', commitCount: 57, contributorCount: 1 }
            ]
        });

        expect(rewritten).toContain('2025 Q2 — 2026 Q2  ·  550 commits  ·  1 contributors  ·  43 tags');
        expect(rewritten).toContain('2025 Q2: 77 commits, 1 contributors, +37,089 / -14,982 lines.');
        expect(rewritten).toContain('2025 Q3: 57 commits, 1 contributors, +15,137 / -14,179 lines.');
        expect(rewritten).not.toContain('3 contributors');
        expect(rewritten).not.toContain('2025 Q3: 57 commits, 2 contributors');
    });

    test('supports locale-specific punctuation used by repo-saga quarter lines', () => {
        const svg = [
            '<svg>',
            '  <text x="800" y="142">2025 Q2 — 2026 Q2 · 577コミット · 3人の貢献者 · 43個のタグ</text>',
            '  <text x="182" y="526">2025 Q2：77コミット、1人の貢献者、+37,089 / -14,982 行。</text>',
            '  <text x="182" y="766">2025 Q3：57コミット、2人の貢献者、+15,137 / -14,179 行。</text>',
            '</svg>'
        ].join('\n');

        const rewritten = rewriteRepoSagaContributorCountsInSvg(svg, {
            summary: {
                rangeStartLabel: '2025 Q2',
                rangeEndLabel: '2026 Q2',
                commitCount: 577,
                contributorCount: 1,
                tagCount: 43
            },
            quarters: [
                { label: '2025 Q2', commitCount: 77, contributorCount: 1 },
                { label: '2025 Q3', commitCount: 57, contributorCount: 1 }
            ]
        });

        expect(rewritten).toContain('2025 Q2 — 2026 Q2 · 577コミット · 1人の貢献者 · 43個のタグ');
        expect(rewritten).toContain('2025 Q3：57コミット、1人の貢献者、+15,137 / -14,179 行。');
    });
});
