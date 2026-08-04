import { TFile } from 'obsidian';
import {
    buildDiagramPreviewPdfExportPath,
    buildDiagramPreviewPanelPdfExportPath,
    buildDiagramPreviewPanelPngExportPath,
    buildDiagramPreviewPanelSvgExportPath,
    buildDiagramPreviewPanelSvgExportPathInFolder,
    buildDiagramSourceArtifactPath,
    buildDiagramPreviewExportPath,
    buildDiagramPreviewPngExportPath,
    renderPreviewArtifactSvg,
    saveDiagramPreviewPdf,
    saveDiagramPreviewPanelPdf,
    saveDiagramPreviewPanelPng,
    saveDiagramPreviewPanelSvg,
    saveDiagramPreviewPanelSvgToFolder,
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

    test('builds a stable pdf export path beside the source file', () => {
        expect(buildDiagramPreviewPdfExportPath('Notes/Topic_diagram.canvas')).toBe('Notes/Topic_diagram_preview.pdf');
        expect(buildDiagramPreviewPdfExportPath('Topic.md')).toBe('Topic_preview.pdf');
    });

    test('builds stable per-panel export paths beside the source file', () => {
        expect(buildDiagramPreviewPanelSvgExportPath('Notes/Topic.md', 'mermaid-1')).toBe('Notes/Topic_preview_mermaid-1.svg');
        expect(buildDiagramPreviewPanelPngExportPath('Notes/Topic.md', 'source visual/2')).toBe('Notes/Topic_preview_source-visual-2.png');
        expect(buildDiagramPreviewPanelPdfExportPath('Topic.md', 'panel')).toBe('Topic_preview_panel.pdf');
    });

    test('builds stable per-panel svg paths inside a selected vault folder', () => {
        expect(buildDiagramPreviewPanelSvgExportPathInFolder('Notes/Topic.md', 'mermaid-1', 'Exports')).toBe('Exports/Topic_preview_mermaid-1.svg');
        expect(buildDiagramPreviewPanelSvgExportPathInFolder('Topic.md', 'panel', '')).toBe('Topic_preview_panel.svg');
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

    test('composes multiple ordered Mermaid panels for export', async () => {
        const render = jest.fn()
            .mockResolvedValueOnce({ svg: '<svg viewBox="0 0 400 120"><text>first diagram</text></svg>' })
            .mockResolvedValueOnce({ svg: '<svg viewBox="0 0 320 180"><text>second diagram</text></svg>' });

        const svg = await renderPreviewArtifactSvg({
            target: 'mermaid',
            content: 'first source\n\nsecond source',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart',
            previewPanels: [
                {
                    id: 'mermaid-1',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nflowchart TD\nA --> B\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'flowchart'
                    }
                },
                {
                    id: 'mermaid-2',
                    artifact: {
                        target: 'mermaid',
                        content: '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```',
                        mimeType: 'text/vnd.mermaid',
                        sourceIntent: 'sequence'
                    }
                }
            ]
        }, {
            mermaid: {
                initialize: jest.fn(),
                parse: jest.fn(),
                render
            }
        });

        expect(render).toHaveBeenCalledTimes(2);
        expect(svg).toContain('first diagram');
        expect(svg).toContain('second diagram');
        expect(svg).toMatch(/height="332"/);
    });

    test('renders persisted companion preview svg without invoking target runtime', async () => {
        await expect(renderPreviewArtifactSvg({
            target: 'drawnix' as any,
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg viewBox="0 0 400 200" data-notemd-renderer="notemd-editable-html-svg@0.1.0"><rect class="notemd-editable-svg-canvas" /></svg>',
                mimeType: 'image/svg+xml'
            }
        })).resolves.toContain('fill: var(--notemd-editable-svg-panel, #ffffff);');
    });

    test('keeps Drawnix companion panels out of the primary SVG export', async () => {
        const mermaidRender = jest.fn();
        const svg = await renderPreviewArtifactSvg({
            target: 'drawnix' as any,
            content: '{"type":"drawnix","elements":[]}',
            mimeType: 'application/vnd.drawnix+json',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg viewBox="0 0 400 200"><text>Drawnix primary</text></svg>',
                mimeType: 'image/svg+xml'
            },
            previewPanels: [{
                id: 'source-visual-1',
                artifact: {
                    target: 'mermaid',
                    content: '```mermaid\nflowchart TD\nA --> B\n```',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'flowchart'
                }
            }]
        }, {
            mermaid: {
                initialize: jest.fn(),
                parse: jest.fn(),
                render: mermaidRender
            }
        });

        expect(svg).toContain('Drawnix primary');
        expect(svg).not.toContain('source-visual-1');
        expect(mermaidRender).not.toHaveBeenCalled();
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

    test('saves a pdf preview artifact beside the source file using the selected ppi', async () => {
        const createCanvas = jest.fn((width: number, height: number) => ({
            width,
            height,
            getContext: () => ({
                scale: jest.fn(),
                drawImage: jest.fn()
            }),
            toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['jpeg'], { type: 'image/jpeg' }))
        }));
        const outputPath = await saveDiagramPreviewPdf(mockApp, 'Notes/Topic.md', {
            target: 'mermaid',
            content: '```mermaid\nflowchart TD\nA --> B\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart'
        }, {
            ppi: 600,
            mermaid: {
                initialize: jest.fn(),
                parse: jest.fn(),
                render: jest.fn().mockResolvedValue({ svg: '<svg viewBox="0 0 400 200"></svg>' })
            },
            raster: {
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
                createCanvas,
                createObjectURL: () => 'blob:pdf',
                revokeObjectURL: jest.fn(),
                blobToArrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer
            }
        });

        expect(outputPath).toBe('Notes/Topic_preview.pdf');
        expect(createCanvas).toHaveBeenCalledWith(2500, 1250);
        expect(mockApp.vault.createBinary).toHaveBeenCalledWith('Notes/Topic_preview.pdf', expect.any(ArrayBuffer));
    });

    test('defaults pdf preview rasterization to 300 ppi when no ppi is supplied', async () => {
        const createCanvas = jest.fn((width: number, height: number) => ({
            width,
            height,
            getContext: () => ({
                scale: jest.fn(),
                drawImage: jest.fn()
            }),
            toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['jpeg'], { type: 'image/jpeg' }))
        }));
        await saveDiagramPreviewPdf(mockApp, 'Notes/Topic.md', {
            target: 'html',
            content: '<!DOCTYPE html><svg width="400" height="200"></svg>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg width="400" height="200"></svg>',
                mimeType: 'image/svg+xml'
            }
        }, {
            raster: {
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
                createCanvas,
                createObjectURL: () => 'blob:pdf-default',
                revokeObjectURL: jest.fn(),
                blobToArrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer
            }
        });

        expect(createCanvas).toHaveBeenCalledWith(1250, 625);
        expect(mockApp.vault.createBinary).toHaveBeenCalledWith('Notes/Topic_preview.pdf', expect.any(ArrayBuffer));
    });

    test('saves an individual panel svg preview without including sibling panels', async () => {
        const outputPath = await saveDiagramPreviewPanelSvg(mockApp, 'Notes/Topic.md', 'mermaid-2', {
            target: 'html',
            content: '<!DOCTYPE html><svg><text>Second panel</text></svg>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>Second panel</text></svg>',
                mimeType: 'image/svg+xml'
            }
        });

        expect(outputPath).toBe('Notes/Topic_preview_mermaid-2.svg');
        expect(mockApp.vault.create).toHaveBeenCalledWith(
            outputPath,
            expect.stringContaining('Second panel')
        );
    });

    test('saves an individual panel svg preview into a selected vault folder', async () => {
        const outputPath = await saveDiagramPreviewPanelSvgToFolder(mockApp, 'Notes/Topic.md', 'mermaid-1', 'Exports', {
            target: 'html',
            content: '<!DOCTYPE html><svg><text>First panel</text></svg>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart',
            previewSvg: {
                content: '<svg><text>First panel</text></svg>',
                mimeType: 'image/svg+xml'
            }
        });

        expect(outputPath).toBe('Exports/Topic_preview_mermaid-1.svg');
        expect(mockApp.vault.create).toHaveBeenCalledWith(outputPath, expect.stringContaining('First panel'));
    });

    test('saves individual panel png and pdf previews through the configured raster pipeline', async () => {
        const raster = {
            createBlob: (parts: BlobPart[], options?: BlobPropertyBag) => new Blob(parts, options),
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
                width: 960,
                height: 540,
                getContext: () => ({ scale: jest.fn(), drawImage: jest.fn() }),
                toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['jpeg'], { type: 'image/jpeg' }))
            }),
            createObjectURL: () => 'blob:panel',
            revokeObjectURL: jest.fn(),
            blobToArrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer
        };
        const artifact = {
            target: 'html' as const,
            content: '<!DOCTYPE html><svg><text>Panel</text></svg>',
            mimeType: 'text/html',
            sourceIntent: 'flowchart' as const,
            previewSvg: { content: '<svg width="96" height="54"><text>Panel</text></svg>', mimeType: 'image/svg+xml' as const }
        };

        const pngPath = await saveDiagramPreviewPanelPng(mockApp, 'Notes/Topic.md', 'panel-1', artifact, {
            pngRaster: raster
        });
        const pdfPath = await saveDiagramPreviewPanelPdf(mockApp, 'Notes/Topic.md', 'panel-1', artifact, {
            raster
        });

        expect(pngPath).toBe('Notes/Topic_preview_panel-1.png');
        expect(pdfPath).toBe('Notes/Topic_preview_panel-1.pdf');
        expect(mockApp.vault.createBinary).toHaveBeenCalledWith(pngPath, expect.any(ArrayBuffer));
        expect(mockApp.vault.createBinary).toHaveBeenCalledWith(pdfPath, expect.any(ArrayBuffer));
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
