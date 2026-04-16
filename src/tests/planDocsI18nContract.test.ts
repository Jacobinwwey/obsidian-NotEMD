import * as fs from 'fs';
import * as path from 'path';

describe('plan docs i18n contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const plansDir = path.join(repoRoot, 'docs', 'superpowers', 'plans');
    const planFiles = fs
        .readdirSync(plansDir)
        .filter((fileName) => fileName.endsWith('.md'))
        .sort();

    test('uses explicit locale suffixes for every plan doc', () => {
        expect(planFiles.length).toBeGreaterThan(0);
        expect(planFiles.every((fileName) => fileName.endsWith('.en.md') || fileName.endsWith('.zh-CN.md'))).toBe(
            true
        );
    });

    const chinesePlanFiles = planFiles.filter((fileName) => fileName.endsWith('.zh-CN.md'));
    const forbiddenMixedMarkers = [
        '**Goal:**',
        '**Architecture:**',
        '**Tech Stack:**',
        '### Task ',
        '**Files:**',
        'Run:',
        'Expected:',
        '**Status:**',
        '**Decisions:**',
        '**Exit Criteria:**',
        '| Task | Status | Current reality |'
    ];
    const forbiddenMixedPatterns = [
        /\*\*Step \d+:/,
        /### Decision \d+:/,
        /\| Priority \| Target \| Why \| Notes \|/,
        /\bTask \d+\b/
    ];

    test.each(chinesePlanFiles)('%s does not keep English structural markers', (fileName) => {
        const content = fs.readFileSync(path.join(plansDir, fileName), 'utf8');

        for (const marker of forbiddenMixedMarkers) {
            expect(content.includes(marker)).toBe(false);
        }

        for (const pattern of forbiddenMixedPatterns) {
            expect(pattern.test(content)).toBe(false);
        }
    });
});
