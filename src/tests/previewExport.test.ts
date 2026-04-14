import { TFile } from 'obsidian';
import {
    buildDiagramPreviewExportPath,
    renderPreviewArtifactSvg,
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
    });

    test('renders preview svg through the target-specific renderer', async () => {
        await expect(renderPreviewArtifactSvg({
            target: 'mermaid',
            content: '```mermaid\nflowchart TD\nA --> B\n```',
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'flowchart'
        }, {
            mermaid: {
                initialize: jest.fn(),
                render: jest.fn().mockResolvedValue({ svg: '<svg><path /></svg>' })
            }
        })).resolves.toContain('<svg>');
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

    test('rejects unsupported export targets', async () => {
        await expect(renderPreviewArtifactSvg({
            target: 'html',
            content: '<div />',
            mimeType: 'text/html',
            sourceIntent: 'flowchart'
        })).rejects.toThrow(/not supported/i);
    });
});
