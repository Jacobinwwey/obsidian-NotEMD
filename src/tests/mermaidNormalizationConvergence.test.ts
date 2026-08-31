import mermaid from 'mermaid';
import { normalizeMermaidDefinition, validateMermaidDefinition } from '../diagram/adapters/mermaid/validator';
import { normalizeMermaidDiagram, repairQuadrantPointLabels } from '../diagram/adapters/mermaid/normalize';
import { renderMermaidArtifactSvg } from '../rendering/preview/mermaidPreview';

jest.mock('mermaid');

describe('Mermaid normalization convergence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mermaid.parse as jest.Mock).mockResolvedValue(true);
    });

    test('recognizes BOM, tilde fences, and the diagram family before repair', () => {
        const normalized = normalizeMermaidDiagram('\uFEFF~~~mermaid\nerDiagram\nUSER {\n string id\n}\n~~~');

        expect(normalized).toEqual(expect.objectContaining({
            family: 'erDiagram',
            hadFence: true,
            fence: '~~~'
        }));
        expect(normalized.content).toContain('USER {');
        expect(normalized.content).not.toContain('\uFEFF');
    });

    test.each([
        ['architecture-beta', 'architecture'],
        ['block-beta', 'block'],
        ['C4Context', 'c4'],
        ['journey', 'journey'],
        ['kanban', 'kanban'],
        ['packet-beta', 'packet'],
        ['pie title Budget', 'pie'],
        ['quadrantChart', 'quadrantChart'],
        ['radar-beta', 'radar'],
        ['requirementDiagram', 'requirement'],
        ['sankey-beta', 'sankey'],
        ['timeline', 'timeline'],
        ['treemap', 'treemap'],
        ['xychart-beta', 'xyChart'],
        ['zenUML', 'zenUML']
    ] as const)('classifies known Mermaid 11 family %s before legacy repair', (header, family) => {
        expect(normalizeMermaidDiagram(`${header}\nA --> B`).family).toBe(family);
    });

    test('keeps genuinely unknown headers as a forward-compatible escape hatch', () => {
        expect(normalizeMermaidDiagram('future-beta\nA --> B').family).toBe('unknown');
        expect(normalizeMermaidDiagram('graphical-beta\nA --> B').family).toBe('unknown');
        expect(normalizeMermaidDiagram('piechart\nA --> B').family).toBe('unknown');
    });

    test('repairs provider-copied quadrant coordinate brackets', () => {
        const source = 'quadrantChart\n    "Docs gallery[": [0.32, 0.68]';
        expect(repairQuadrantPointLabels(source)).toContain('"Docs gallery": [0.32, 0.68]');
        expect(normalizeMermaidDiagram(source).content).toContain('"Docs gallery": [0.32, 0.68]');
    });

    test('uses the same ER normalization for render validation and preview', async () => {
        const source = '```mermaid\nerDiagram\n    USER\n        string id\n    ORDER\n        string id\n    USER ||--o ORDER : owns\n```';

        await validateMermaidDefinition(source);
        const validatedDefinition = (mermaid.parse as jest.Mock).mock.calls[0][0];

        const render = jest.fn().mockResolvedValue({ svg: '<svg viewBox="0 0 100 100"><rect /></svg>' });
        await renderMermaidArtifactSvg({
            target: 'mermaid',
            content: source,
            mimeType: 'text/vnd.mermaid',
            sourceIntent: 'erDiagram'
        }, { initialize: jest.fn(), parse: jest.fn(), render }, 'light');

        expect(render.mock.calls[0][1]).toBe(validatedDefinition);
        expect(normalizeMermaidDefinition(source)).toBe(validatedDefinition);
        expect(validatedDefinition).toContain('USER {');
        expect(validatedDefinition).toContain('USER ||--o{ ORDER : owns');
    });
});
