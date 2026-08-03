import { TFile, TFolder } from 'obsidian';
import { saveDiagramArtifactFile } from '../fileUtils';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';
import { ProgressReporter } from '../types';

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

describe('saveDiagramArtifactFile', () => {
    const originalFile = {
        basename: 'Source',
        name: 'Source.md',
        path: 'Notes/Source.md',
        parent: { path: 'Notes' }
    } as TFile;

    beforeEach(() => {
        jest.clearAllMocks();
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.createFolder as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);
    });

    test('saves mermaid artifacts as markdown files', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'mermaid',
            content: '```mermaid\nmindmap\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'mindmap'
        }, reporter);

        expect(path).toBe('Notes/Source_summ.md');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Notes/Source_summ.md', '```mermaid\nmindmap\n```\n\n\n');
    });

    test('saves json-canvas artifacts with canvas extension and target-specific suffix', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        }, reporter);

        expect(path).toBe('Notes/Source_diagram.canvas');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Notes/Source_diagram.canvas', '{"nodes":[],"edges":[]}');
    });

    test('reuses custom summarize output folder when configured', async () => {
        const reporter = createReporter();
        const settings = {
            ...mockSettings,
            useCustomSummarizeToMermaidSavePath: true,
            summarizeToMermaidSavePath: 'Generated/Diagrams'
        };
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Generated/Diagrams') {
                return Object.assign(new (TFolder as any)(), { path });
            }
            return null;
        });

        const path = await saveDiagramArtifactFile(mockApp, settings, originalFile, {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        }, reporter);

        expect(path).toBe('Generated/Diagrams/Source_diagram.canvas');
    });

    test('saves vega-lite artifacts as markdown files with readable content', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'vega-lite',
            content: '{"$schema":"https://vega.github.io/schema/vega-lite/v5.json"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        }, reporter);

        expect(path).toBe('Notes/Source_diagram.md');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.md',
            expect.stringContaining('vega-lite')
        );
    });

    test('saves circuitikz artifacts as tex files for source-only preview', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'circuitikz' as any,
            content: '\\usepackage{circuitikz}\n\\begin{document}\n\\begin{circuitikz}\n\\end{circuitikz}\n\\end{document}',
            mimeType: 'text/x-tex',
            sourceIntent: 'flowchart'
        }, reporter);

        expect(path).toBe('Notes/Source_diagram.tex');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.tex',
            expect.stringContaining('\\begin{circuitikz}')
        );
    });

    test('saves drawio and drawnix artifacts with native source-only extensions', async () => {
        const reporter = createReporter();
        const drawioPath = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'drawio' as any,
            content: '<mxfile><diagram /></mxfile>',
            mimeType: 'application/vnd.jgraph.mxfile',
            sourceIntent: 'flowchart'
        }, reporter);
        const drawnixPath = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'drawnix' as any,
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'flowchart'
        }, reporter);

        expect(drawioPath).toBe('Notes/Source_diagram.drawio');
        expect(drawnixPath).toBe('Notes/Source_diagram.drawnix');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawio',
            expect.stringContaining('<mxfile')
        );
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawnix',
            expect.stringContaining('"type":"drawnix"')
        );
    });

    test('saves non-native diagram artifacts with svg companion and Obsidian wrapper when available', async () => {
        const reporter = createReporter();
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'drawio' as any,
            content: '<mxfile><diagram /></mxfile>',
            mimeType: 'application/vnd.jgraph.mxfile',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>Architecture</text></svg>',
                mimeType: 'image/svg+xml'
            }
        }, reporter);

        expect(path).toBe('Notes/Source_diagram.drawio.md');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawio',
            expect.stringContaining('<mxfile')
        );
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawio.svg',
            expect.stringContaining('<svg')
        );
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawio.md',
            expect.stringContaining('![[Source_diagram.drawio.svg]]')
        );
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawio.md',
            expect.stringContaining('[[Source_diagram.drawio]]')
        );
    });

    test('saves multiple source visual companions and binary image content', async () => {
        const reporter = createReporter();
        const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
        const path = await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'drawnix',
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'drawnixMindmap',
            previewSvg: { content: '<svg><text>Map</text></svg>', mimeType: 'image/svg+xml' },
            companions: [
                { path: 'source-visual-1.svg', content: '<svg><text>Mermaid</text></svg>', mimeType: 'image/svg+xml' },
                { path: 'source-visual-1.png', content: imageBytes, mimeType: 'image/png', binary: true },
                {
                    path: 'source-visual-manifest.json',
                    content: JSON.stringify({
                        version: 1,
                        visuals: [{ id: 'source-visual-1', companionPaths: ['source-visual-1.svg', 'source-visual-1.png'] }]
                    }),
                    mimeType: 'application/json'
                }
            ]
        }, reporter);

        expect(path).toBe('Notes/Source_diagram.drawnix.md');
        expect(mockApp.vault.createFolder).toHaveBeenCalledWith('Notes/Source_diagram.drawnix.assets');
        expect(mockApp.vault.createBinary).toHaveBeenCalledWith('Notes/Source_diagram.drawnix.assets/source-visual-1.png', imageBytes);
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawnix.assets/source-visual-manifest.json',
            expect.stringContaining('Source_diagram.drawnix.assets/source-visual-1.svg')
        );
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawnix.md',
            expect.stringContaining('![[Source_diagram.drawnix.assets/source-visual-1.png]]')
        );
    });

    test('rewrites native Drawnix source visual paths into the companion scope', async () => {
        const reporter = createReporter();
        const content = JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [{ id: 'root', type: 'mindmap', children: [] }],
            viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [{
                        id: 'source-visual-1',
                        kind: 'mermaid',
                        status: 'resolved',
                        sourceHash: 'abc12345',
                        companionPaths: ['source-visual-1.svg']
                    }]
                }
            }
        });

        await saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'drawnix',
            content,
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'drawnixMindmap',
            companions: [{
                path: 'source-visual-1.svg',
                content: '<svg />',
                mimeType: 'image/svg+xml'
            }]
        }, reporter);

        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Source_diagram.drawnix',
            expect.stringContaining('Source_diagram.drawnix.assets/source-visual-1.svg')
        );
    });

    test('restores existing files when a later artifact write fails', async () => {
        const reporter = createReporter();
        const svgFile = Object.create(TFile.prototype) as TFile;
        const artifactFile = Object.create(TFile.prototype) as TFile;
        const wrapperFile = Object.create(TFile.prototype) as TFile;
        const originalContents = new Map<unknown, string>([
            [svgFile, '<svg>old</svg>'],
            [artifactFile, 'old drawnix'],
            [wrapperFile, 'old wrapper']
        ]);
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockImplementation((path: string) => {
            if (path === 'Notes/Source_diagram.drawnix.svg') {
                return svgFile;
            }
            if (path === 'Notes/Source_diagram.drawnix') {
                return artifactFile;
            }
            if (path === 'Notes/Source_diagram.drawnix.md') {
                return wrapperFile;
            }
            return null;
        });
        (mockApp.vault.read as jest.Mock).mockImplementation((file: TFile) => Promise.resolve(originalContents.get(file) ?? ''));
        let failWrapperWrite = true;
        (mockApp.vault.modify as jest.Mock).mockImplementation(async (file: TFile, content: string) => {
            if (file === wrapperFile && failWrapperWrite) {
                failWrapperWrite = false;
                throw new Error('wrapper write failed');
            }
            return undefined;
        });

        await expect(saveDiagramArtifactFile(mockApp, mockSettings, originalFile, {
            target: 'drawnix',
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'drawnixMindmap',
            previewSvg: { content: '<svg>new</svg>', mimeType: 'image/svg+xml' }
        }, reporter)).rejects.toThrow('wrapper write failed');

        expect(mockApp.vault.modify).toHaveBeenCalledWith(svgFile, '<svg>old</svg>');
        expect(mockApp.vault.modify).toHaveBeenCalledWith(artifactFile, 'old drawnix');
        expect(mockApp.vault.modify).toHaveBeenCalledWith(wrapperFile, 'old wrapper');
    });
});
