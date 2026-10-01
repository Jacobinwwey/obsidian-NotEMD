import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

const requireScript = createRequire(__filename);
const repoRoot = path.join(__dirname, '../..');

describe('website publication and locale admission', () => {
    test('review receipts detect source drift, changed translations and missing review without depending on checkout line endings', () => {
        const { assertReviewedDocument } = requireScript('../../website/scripts/audit-build.cjs');
        const source = '# Installation\n\nChoose a provider.\n';
        const translated = '# インストール\n\nプロバイダーを選択します。\n';
        const hash = (content: string) => createHash('sha256').update(content).digest('hex');
        const receipt = { sourceSha256: hash(source), authoredSha256: hash(translated) };
        expect(() => assertReviewedDocument(source, translated, receipt, 'ja installation')).not.toThrow();
        expect(() => assertReviewedDocument(source.replace(/\n/g, '\r\n'), translated.replace(/\n/g, '\r\n'), receipt, 'Windows checkout')).not.toThrow();
        expect(() => assertReviewedDocument(source + 'New output contract.\n', translated, receipt, 'Source changed')).toThrow(/source|Source/);
        expect(() => assertReviewedDocument(source, translated + 'Unexpected text.\n', receipt, 'Translation changed')).toThrow(/authored|translation|Translation/);
        expect(() => assertReviewedDocument(source, translated, undefined, 'Missing review')).toThrow(/review|receipt/);
    });

    test('rejects English fallback prose across ordinary guides while permitting shared technical titles', () => {
        const { auditLocalizedLanguageSignal } = requireScript('../../website/scripts/audit-build.cjs');
        const source = '# Installation\n\n<TLDR>Install the plugin and inspect one note.</TLDR>';
        expect(() => auditLocalizedLanguageSignal('de', source, '# Installation\n\n<TLDR>Installiere das Plugin und prüfe eine Notiz.</TLDR>', 'German installation')).not.toThrow();
        expect(() => auditLocalizedLanguageSignal('de', source, source, 'German fallback')).toThrow(/English|fallback/);
        expect(() => auditLocalizedLanguageSignal('ja', source, '# インストール\n\n<TLDR>Install the plugin and inspect one note.</TLDR>', 'Japanese fallback')).toThrow(/English|script|fallback/);
    });

    test('requires every locale homepage to expose the four audience journeys and current release', () => {
        const { auditHomepageAudienceLinks } = requireScript('../../website/scripts/audit-build.cjs');
        const { version } = requireScript('../../website/src/lib/releaseFacts.cjs');
        const base = '/obsidian-NotEMD/ja/';
        const routes = ['getting-started/quick-start', 'features/workflows', 'developers/overview', 'agents/overview', `releases/${version}`];
        const valid = routes.map(route => `<a href="${base}docs/${route}">入口</a>`).join('');
        expect(() => auditHomepageAudienceLinks(valid, base, 'Japanese homepage')).not.toThrow();
        expect(() => auditHomepageAudienceLinks(valid.replace(`href="${base}docs/agents/overview"`, 'href="#"'), base, 'Broken homepage')).toThrow(/agents\/overview/);
        expect(() => auditHomepageAudienceLinks(valid.replace(`releases/${version}`, 'releases/0.0.0'), base, 'Stale release')).toThrow(/releases/);
    });

    test.each(['draft', 'prerelease', 'wrong-tag', 'missing-asset', 'empty-asset'])('rejects %s release before Pages deployment', scenario => {
        const { assertPublishedRelease } = requireScript('../../website/scripts/verify-published-release.cjs');
        const { version } = requireScript('../../website/src/lib/releaseFacts.cjs');
        const release = {
            tag_name: version, draft: false, prerelease: false,
            assets: ['main.js', 'manifest.json', 'styles.css', 'README.md'].map(name => ({ name, size: 100, state: 'uploaded' }))
        };
        if (scenario === 'draft') release.draft = true;
        if (scenario === 'prerelease') release.prerelease = true;
        if (scenario === 'wrong-tag') release.tag_name = '0.0.0';
        if (scenario === 'missing-asset') release.assets.pop();
        if (scenario === 'empty-asset') release.assets[0].size = 0;
        expect(() => assertPublishedRelease(release, version)).toThrow();
    });

    test('accepts a public stable release containing every required uploaded asset', () => {
        const { assertPublishedRelease } = requireScript('../../website/scripts/verify-published-release.cjs');
        expect(() => assertPublishedRelease({ tag_name: '1.9.8', draft: false, prerelease: false,
            assets: ['main.js', 'manifest.json', 'styles.css', 'README.md'].map(name => ({ name, size: 42, state: 'uploaded' }))
        }, '1.9.8')).not.toThrow();
        for (const invalid of [null, {}, { draft: false, tag_name: '1.9.8', assets: [] }]) {
            expect(() => assertPublishedRelease(invalid, '1.9.8')).toThrow();
        }
    });

    test('PR builds are read-only, retain browser evidence and cannot enter the deploy job', () => {
        const yaml = requireScript('js-yaml');
        const workflow = yaml.load(fs.readFileSync(path.join(repoRoot, '.github/workflows/deploy-docs.yml'), 'utf8'));
        expect(workflow.on).toHaveProperty('pull_request');
        expect(workflow.permissions).toEqual({ contents: 'read' });
        expect(workflow.jobs.deploy.permissions).toEqual({ contents: 'read', pages: 'write', 'id-token': 'write' });
        expect(workflow.jobs.deploy.if).toContain("github.event_name != 'pull_request'");
        expect(workflow.jobs.deploy.if).toContain("github.ref == 'refs/heads/main'");
        const steps = workflow.jobs.build.steps;
        expect(steps.some((step: { run?: string }) => step.run?.includes('audit:navigation'))).toBe(true);
        expect(steps.some((step: { uses?: string; if?: string }) => step.uses?.startsWith('actions/upload-artifact@') && step.if === 'always()')).toBe(true);
        const gate = workflow.jobs.deploy.steps.findIndex((step: { run?: string }) => step.run?.includes('verify-published-release.cjs'));
        const deploy = workflow.jobs.deploy.steps.findIndex((step: { uses?: string }) => step.uses?.startsWith('actions/deploy-pages@'));
        expect(gate).toBeGreaterThan(-1);
        expect(gate).toBeLessThan(deploy);
    });
});
