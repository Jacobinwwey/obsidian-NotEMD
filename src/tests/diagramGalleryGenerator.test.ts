import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

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
        png: Buffer;
    }>) => {
        schemaVersion: number;
        entries: Array<{ fixtureId: string; svgPath: string; pngPath: string; svgSha256: string; pngSha256: string }>;
    };
    collectStaleGalleryAssetNames: (existingNames: string[], expectedNames: Set<string>) => string[];
};
const { verifyCommittedGallery } = createRequire(__filename)('../../scripts/generate-diagram-gallery.js');
const originalPng = fs.readFileSync(path.join(repoRoot, 'docs/assets/diagrams/flowchart-release.png'));

describe('diagram gallery generator', () => {
    test('derives stable asset names and hashes from executable render output', () => {
        const manifest = runtime.buildGalleryManifest([{
            typeId: 'flowchart',
            fixtureId: 'flowchart-release',
            title: 'Release decision',
            target: 'mermaid',
            svg: '<svg role="img"><title>Release decision</title><desc>Flow</desc></svg>',
            png: originalPng
        }]);

        expect(manifest.schemaVersion).toBe(1);
        expect(manifest.entries[0]).toMatchObject({
            fixtureId: 'flowchart-release',
            svgPath: './flowchart-release.svg',
            pngPath: './flowchart-release.png'
        });
        expect(manifest.entries[0].svgSha256).toMatch(/^[a-f0-9]{64}$/);
        expect(manifest.entries[0].pngSha256).toMatch(/^[a-f0-9]{64}$/);
    });

    test('checks archived PNG identity independently of regenerated cross-platform pixels', () => {
        const cache = path.join(repoRoot, '.cache');
        fs.mkdirSync(cache, { recursive: true });
        const root = fs.mkdtempSync(path.join(cache, 'gallery-integrity-'));
        if (path.dirname(root) !== cache) throw new Error('Unexpected gallery fixture path');
        const entry = { typeId: 'flowchart', fixtureId: 'flowchart-release', title: 'Release decision',
            target: 'mermaid', svg: '<svg xmlns="http://www.w3.org/2000/svg">\n</svg>', png: originalPng };
        const otherName = fs.readdirSync(path.join(repoRoot, 'docs/assets/diagrams'))
            .find(name => name.endsWith('.png') && name !== 'flowchart-release.png')!;
        const otherPng = fs.readFileSync(path.join(repoRoot, 'docs/assets/diagrams', otherName));
        try {
            const manifest = runtime.buildGalleryManifest([entry]);
            fs.writeFileSync(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
            fs.writeFileSync(path.join(root, 'flowchart-release.svg'), entry.svg);
            fs.writeFileSync(path.join(root, 'flowchart-release.png'), entry.png);
            // A different renderer's PNG is not the identity source for the committed archive.
            expect(() => verifyCommittedGallery([{ ...entry, png: otherPng }], root)).not.toThrow();
            fs.writeFileSync(path.join(root, 'flowchart-release.svg'), entry.svg.replace(/\n/g, '\r\n'));
            expect(() => verifyCommittedGallery([entry], root)).not.toThrow();
            fs.writeFileSync(path.join(root, 'flowchart-release.png'), otherPng);
            expect(() => verifyCommittedGallery([entry], root)).toThrow(/png.*hash|png.*identity/i);
            fs.writeFileSync(path.join(root, 'flowchart-release.png'), entry.png);
            fs.writeFileSync(path.join(root, 'flowchart-release.svg'), '<svg>changed</svg>');
            expect(() => verifyCommittedGallery([entry], root)).toThrow(/svg.*stale/i);
            fs.writeFileSync(path.join(root, 'flowchart-release.svg'), entry.svg);
            fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({ ...manifest, entries: [] }));
            expect(() => verifyCommittedGallery([entry], root)).toThrow(/manifest/i);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
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
        expect(entrySource).toContain('collectSvgPresentationDiagnostics');
        expect(entrySource).not.toMatch(/const\s+fixtures\s*=/i);
        expect(packageJson.scripts['diagram:gallery']).toBe('node scripts/generate-diagram-gallery.js');
        expect(packageJson.scripts['diagram:gallery:check']).toBe('node scripts/generate-diagram-gallery.js --check');
    });

});
