import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const referenceCatalog = require('../diagram/diagramReferenceCatalog.json') as Array<{
    id: string;
    previewAssetId: string;
    screenshotFileName: string;
}>;

const repoRoot = path.resolve(__dirname, '..', '..');
// The gallery runtime is a CommonJS script outside the plugin TypeScript root.
// Keep it as a test-only host boundary so production tsc does not absorb scripts/.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const runtime = require('../../scripts/lib/diagram-gallery-runtime.js') as {
    buildGalleryManifest: (entries: Array<{
        typeId: string;
        fixtureId: string;
        title: string;
        target: string;
        svg: string;
    }>) => {
        schemaVersion: number;
        entries: Array<{ fixtureId: string; svgPath: string; pngPath: string; svgSha256: string }>;
    };
    collectStaleGalleryAssetNames: (existingNames: string[], expectedNames: Set<string>) => string[];
};

describe('diagram gallery generator', () => {
    test('derives stable asset names and hashes from executable render output', () => {
        const manifest = runtime.buildGalleryManifest([{
            typeId: 'flowchart',
            fixtureId: 'flowchart-release',
            title: 'Release decision',
            target: 'mermaid',
            svg: '<svg role="img"><title>Release decision</title><desc>Flow</desc></svg>'
        }]);

        expect(manifest.schemaVersion).toBe(1);
        expect(manifest.entries[0]).toMatchObject({
            fixtureId: 'flowchart-release',
            svgPath: './flowchart-release.svg',
            pngPath: './flowchart-release.png'
        });
        expect(manifest.entries[0].svgSha256).toMatch(/^[a-f0-9]{64}$/);
    });

    test('identifies obsolete generated assets without touching unrelated files', () => {
        expect(runtime.collectStaleGalleryAssetNames(
            ['flowchart-release.svg', 'old.png', 'README.md', 'manifest.json'],
            new Set(['flowchart-release.svg', 'flowchart-release.png', 'manifest.json'])
        )).toEqual(['old.png']);
    });

    test('uses the production fixture catalog and exposes generate/check package scripts', () => {
        const entrySource = fs.readFileSync(
            path.join(repoRoot, 'scripts', 'diagram-gallery-browser-entry.ts'),
            'utf8'
        );
        const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

        expect(entrySource).toContain('getExecutableDiagramExamples');
        expect(entrySource).toContain('renderExecutableDiagramExample');
        expect(entrySource).not.toMatch(/const\s+fixtures\s*=/i);
        expect(packageJson.scripts['diagram:gallery']).toBe('node scripts/generate-diagram-gallery.js');
        expect(packageJson.scripts['diagram:gallery:check']).toBe('node scripts/generate-diagram-gallery.js --check');
        expect(packageJson.scripts['verify:diagram-reference-assets']).toBe('node scripts/verify-diagram-reference-assets.js');
    });

    test('keeps the reference catalog complete and uniquely addressable', () => {
        expect(referenceCatalog).toHaveLength(27);
        expect(new Set(referenceCatalog.map(entry => entry.id)).size).toBe(27);
        expect(new Set(referenceCatalog.map(entry => entry.previewAssetId)).size).toBe(27);
        expect(referenceCatalog.every(entry => entry.screenshotFileName.endsWith('.png'))).toBe(true);
    });
});
