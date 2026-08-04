import {
    getDiagramPreviewSourceFolder,
    normalizeDiagramPreviewExportFolderPath
} from '../ui/DiagramPreviewExportFolderModal';

describe('diagram preview export folder selection helpers', () => {
    test('derives the source folder for default multi-panel exports', () => {
        expect(getDiagramPreviewSourceFolder('1Knowledge/architecture.zh-CN.md')).toBe('1Knowledge');
        expect(getDiagramPreviewSourceFolder('architecture.md')).toBe('');
        expect(getDiagramPreviewSourceFolder('Notes\\Topic.md')).toBe('Notes');
    });

    test('normalizes Vault-relative custom folders', () => {
        expect(normalizeDiagramPreviewExportFolderPath(' /Exports\\Architecture/ ')).toBe('Exports/Architecture');
        expect(normalizeDiagramPreviewExportFolderPath('')).toBe('');
    });

    test('rejects absolute and traversal paths', () => {
        for (const path of ['C:/Exports', '//server/Exports', '../Exports', 'Exports/../Other']) {
            expect(() => normalizeDiagramPreviewExportFolderPath(path)).toThrow(/Vault-relative/i);
        }
    });
});
