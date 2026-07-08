import { TFile } from 'obsidian';
import {
    buildDiagramSourceArtifactPath,
    buildDiagramPreviewExportPath,
    buildDiagramPreviewPngExportPath,
    renderPreviewArtifactSvg,
    saveDiagramPreviewPng,
    saveDiagramSourceArtifact,
    saveDiagramPreviewSvg,
    supportsPreviewSvgExport
} from '../rendering/preview/previewExport';
import { mockApp } from './__mocks__/app';

describe('diagram preview export helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
        (mockApp.vault.create as jest.Mock).mockResolvedValue(undefined);
        (mockApp.vault.modify as jest.Mock).mockResolvedValue(undefined);
    });

    test('builds a stable svg export path beside the source file', () => {
        expect(buildDiagramPreviewExportPath('Notes/Topic_diagram.canvas')).toBe('Notes/Topic_diagram_preview.svg');
        expect(buildDiagramPreviewExportPath('Topic.md')).toBe('Topic_preview.svg');
        expect(buildDiagramPreviewExportPath('Notes/Topic_preview.svg')).toBe('Notes/Topic_preview.svg');
    });

    test('builds a stable png export path beside the source file', () => {
        expect(buildDiagramPreviewPngExportPath('Notes/Topic_diagram.canvas')).toBe('Notes/Topic_diagram_preview.png');
        expect(buildDiagramPreviewPngExportPath('Topic.md')).toBe('Topic_preview.png');
    });

    test('builds a target-aware raw artifact path beside the source note', () => {
        expect(buildDiagramSourceArtifactPath('Notes/Topic.md', {
            target: 'mermaid',
            content: '',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart'
        })).toBe('Notes/Topic_summ.md');

        expect(buildDiagramSourceArtifactPath('Notes/Topic.md', {
            target: 'json-canvas',
            content: '',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        })).toBe('Notes/Topic_diagram.canvas');
    });

    test('reports which artifact targets support svg export', () => {
        expect(supportsPreviewSvgExport({
            target: 'mermaid',
            content: '',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'mindmap'
        })).toBe(true);
        expect(supportsPreviewSvgExport({
            target: 'json-canvas',
            content: '',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        })).toBe(true);
        expect(supportsPreviewSvgExport({
            target: 'vega-lite',
            content: '',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        })).toBe(true);
        expect(supportsPreviewSvgExport({
            target: 'html',
            content: '<div />',
            mimeType: 'text/html',
            sourceIntent: 'flowchart'
        })).toBe(false);
        expect(supportsPreviewSvgExport({
            target: 'html',
            content: '<!DOCTYPE html><html><body><svg /></body></html>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><rect /></svg>',
                mimeType: 'image/svg+xml'
            }
        })).toBe(true);
        expect(supportsPreviewSvgExport({
            target: 'drawio' as any,
            content: '<mxfile />',
            mimeType: 'application/vnd.jgraph.mxfile',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><rect /></svg>',
                mimeType: 'image/svg+xml'
            }
        })).toBe(true);
    });

    test('renders preview svg through the target-specific renderer', async () => {
        const initialize = jest.fn();
        await expect(renderPreviewArtifactSvg({
            target: 'mermaid',
            content: '```mermaid\nflowchart TD\nA --> B\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart'
        }, {
            mermaid: {
                initialize,
                parse: jest.fn(),
                render: jest.fn().mockResolvedValue({ svg: '<svg><path /></svg>' })
            },
            theme: 'dark'
        })).resolves.toContain('<svg>');
        expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    });

    test('renders persisted companion preview svg without invoking target runtime', async () => {
        await expect(renderPreviewArtifactSvg({
            target: 'drawnix' as any,
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>Drawnix preview</text></svg>',
                mimeType: 'image/svg+xml'
            }
        })).resolves.toContain('Drawnix preview');
    });

    test('saves a new exported preview svg beside the source file', async () => {
        const outputPath = await saveDiagramPreviewSvg(mockApp, 'Notes/Topic_diagram.canvas', {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        });

        expect(outputPath).toBe('Notes/Topic_diagram_preview.svg');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Topic_diagram_preview.svg',
            expect.stringContaining('<svg')
        );
    });

    test('overwrites an existing exported preview svg file', async () => {
        (mockApp.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(Object.assign(new (TFile as any)(), {
            path: 'Notes/Topic_preview.svg'
        }));

        const outputPath = await saveDiagramPreviewSvg(mockApp, 'Notes/Topic.md', {
            target: 'json-canvas',
            content: '{"nodes":[],"edges":[]}',
            mimeType: 'application/json',
            sourceIntent: 'canvasMap'
        });

        expect(outputPath).toBe('Notes/Topic_preview.svg');
        expect(mockApp.vault.modify).toHaveBeenCalledWith(
            expect.any(TFile),
            expect.stringContaining('<svg')
        );
    });

    test('saves a raw preview artifact file with target-specific extension', async () => {
        const outputPath = await saveDiagramSourceArtifact(mockApp, 'Notes/Topic.md', {
            target: 'vega-lite',
            content: '{"mark":"bar"}',
            mimeType: 'application/json',
            sourceIntent: 'dataChart'
        });

        expect(outputPath).toBe('Notes/Topic_diagram.json');
        expect(mockApp.vault.create).toHaveBeenCalledWith('Notes/Topic_diagram.json', '{"mark":"bar"}');
    });

    test('saves editable html/svg source artifacts as html documents', async () => {
        const outputPath = await saveDiagramSourceArtifact(mockApp, 'Notes/Runtime.md', {
            target: 'editable-html-svg',
            content: '<!DOCTYPE html><html><body><svg /></body></html>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart'
        });

        expect(outputPath).toBe('Notes/Runtime_diagram.html');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Runtime_diagram.html',
            expect.stringContaining('<svg')
        );
    });

    test('saves circuitikz source-only artifacts as tex documents', async () => {
        const outputPath = await saveDiagramSourceArtifact(mockApp, 'Notes/Inverter.md', {
            target: 'circuitikz' as any,
            content: '\\usepackage{circuitikz}\n\\begin{document}\n\\begin{circuitikz}\n\\end{circuitikz}\n\\end{document}',
            mimeType: 'text/x-tex',
            sourceIntent: 'flowchart'
        });

        expect(outputPath).toBe('Notes/Inverter_diagram.tex');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Inverter_diagram.tex',
            expect.stringContaining('\\begin{circuitikz}')
        );
    });

    test('saves drawio and drawnix source-only artifacts with native extensions', async () => {
        const drawioPath = await saveDiagramSourceArtifact(mockApp, 'Notes/Architecture.md', {
            target: 'drawio' as any,
            content: '<mxfile><diagram /></mxfile>',
            mimeType: 'application/vnd.jgraph.mxfile',
            sourceIntent: 'flowchart'
        });
        const drawnixPath = await saveDiagramSourceArtifact(mockApp, 'Notes/Architecture.md', {
            target: 'drawnix' as any,
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'flowchart'
        });

        expect(drawioPath).toBe('Notes/Architecture_diagram.drawio');
        expect(drawnixPath).toBe('Notes/Architecture_diagram.drawnix');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Architecture_diagram.drawio',
            expect.stringContaining('<mxfile')
        );
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            'Notes/Architecture_diagram.drawnix',
            expect.stringContaining('"type":"drawnix"')
        );
    });

    test('saves a png preview artifact beside the source file', async () => {
        const outputPath = await saveDiagramPreviewPng(mockApp, 'Notes/Topic.md', {
            target: 'mermaid',
            content: '```mermaid\nflowchart TD\nA --> B\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart'
        }, {
            mermaid: {
                initialize: jest.fn(),
                parse: jest.fn(),
                render: jest.fn().mockResolvedValue({ svg: '<svg width="40" height="20"></svg>' })
            },
            pngRaster: {
                createBlob: (parts, options) => new Blob(parts, options),
                createImage: () => {
                    const image = {
                        onload: null as null | (() => void),
                        onerror: null as null | ((event?: unknown) => void),
                        set src(_value: string) {
                            this.onload?.();
                        }
                    };
                    return image;
                },
                createCanvas: () => ({
                    width: 80,
                    height: 40,
                    getContext: () => ({
                        scale: jest.fn(),
                        drawImage: jest.fn()
                    }),
                    toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['png'], { type: 'image/png' }))
                }),
                createObjectURL: () => 'blob:png',
                revokeObjectURL: jest.fn(),
                blobToArrayBuffer: async () => new ArrayBuffer(12),
                getScale: () => 2
            }
        });

        expect(outputPath).toBe('Notes/Topic_preview.png');
        expect(mockApp.vault.createBinary).toHaveBeenCalledWith('Notes/Topic_preview.png', expect.any(ArrayBuffer));
    });

    test('rejects unsupported export targets', async () => {
        await expect(renderPreviewArtifactSvg({
            target: 'html',
            content: '<div />',
            mimeType: 'text/html',
            sourceIntent: 'flowchart'
        })).rejects.toThrow(/not supported/i);
    });
});
