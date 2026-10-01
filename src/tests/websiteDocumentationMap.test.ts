import { createRequire } from 'module';

const requireScript = createRequire(__filename);
const { renderDocumentationMap } = requireScript('../../website/plugins/documentation-map.cjs');
const repositoryUrl = 'https://github.com/Jacobinwwey/obsidian-NotEMD';
const siteRoot = 'https://jacobinwwey.github.io/obsidian-NotEMD/';

function facts(version: string) {
    return { version, repositoryUrl, releaseUrl: `${repositoryUrl}/releases/tag/${version}` };
}

const inputs = {
    siteRoot,
    release: facts('1.9.8'),
    locales: [{ locale: 'en' }, { locale: 'zh-CN' }, { locale: 'ar' }],
    guidePaths: ['/docs/intro', '/docs/agents/overview', '/docs/advanced/troubleshooting'],
    languageScope: 'English and Simplified Chinese are indexable; other routes remain available for review.',
};

describe('built Agent documentation map', () => {
    test('projects the release version and URL together without preserving a stale version', () => {
        const output = renderDocumentationMap({ ...inputs, release: facts('2.0.1') });
        expect(output).toContain('Current documented release: 2.0.1');
        expect(output).toContain(`${repositoryUrl}/releases/tag/2.0.1`);
        expect(output).toContain(`${siteRoot}docs/releases/2.0.1`);
        expect(output).not.toMatch(/1\.9\.[78]/);
    });

    test('keeps every supplied source route and localized entry under the deployment base path', () => {
        const output = renderDocumentationMap(inputs);
        for (const route of inputs.guidePaths) {
            expect(output).toContain(`${siteRoot}${route.slice(1)}`);
            expect(output).toContain(`${siteRoot}zh-CN${route}`);
        }
        expect(output).toContain(`${siteRoot}ar/docs/intro`);
        expect(output).toContain(inputs.languageScope);
        expect(output).not.toContain('https://jacobinwwey.github.io/docs/');
    });

    test('exposes all audience paths and only the four bounded public command IDs', () => {
        const output = renderDocumentationMap(inputs);
        for (const route of ['getting-started/quick-start', 'features/workflows', 'developers/overview', 'agents/overview']) {
            expect(output).toContain(`${siteRoot}docs/${route}`);
        }
        expect([...output.matchAll(/notemd:[a-z-]+/g)].map(match => match[0]).sort()).toEqual([
            'notemd:export-cli-capability-manifest',
            'notemd:export-cli-invocation-contract',
            'notemd:export-cli-public-surface',
            'notemd:export-provider-profiles-redacted',
        ]);
        expect(output).toContain('available Obsidian host and Vault');
        expect(output).toContain('not a general public note-writing API');
        expect(output).toContain('not a ranking mechanism');
    });
});
