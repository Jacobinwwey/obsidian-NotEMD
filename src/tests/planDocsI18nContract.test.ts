import * as fs from 'fs';
import * as path from 'path';

describe('plan docs i18n contract', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const plansDir = path.join(repoRoot, 'docs', 'superpowers', 'plans');
    const schemeAPlanBase = '2026-07-11-vault-history-settings-navigation-batch-folder';
    const schemeADesignBase = path.join(
        repoRoot,
        'docs',
        'plans',
        '2026-07-11-vault-history-settings-navigation-batch-folder-design'
    );
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

    test('records every Scheme A implementation step as completed in both plan locales', () => {
        const englishPlan = fs.readFileSync(path.join(plansDir, `${schemeAPlanBase}.en.md`), 'utf8');
        const chinesePlan = fs.readFileSync(path.join(plansDir, `${schemeAPlanBase}.zh-CN.md`), 'utf8');

        expect(englishPlan).toContain('**Status:** Complete on `main`');
        expect(chinesePlan).toContain('**状态：** 已在 `main` 完成');
        for (const content of [englishPlan, chinesePlan]) {
            expect(content).not.toMatch(/^- \[ \]/gm);
            expect(content.match(/^- \[x\]/gm)).toHaveLength(29);
        }
    });

    test('keeps both Scheme A design documents readable UTF-8 instead of mojibake', () => {
        const englishDesign = fs.readFileSync(`${schemeADesignBase}.en.md`, 'utf8');
        const chineseDesign = fs.readFileSync(`${schemeADesignBase}.zh-CN.md`, 'utf8');

        expect(englishDesign).toContain('[简体中文]');
        expect(chineseDesign).toContain('# Vault 图形历史、设置导览与批处理文件夹安全设计');
        for (const content of [englishDesign, chineseDesign]) {
            expect(content).not.toMatch(/Ã|â€|å›|ç®/);
        }
    });
});
