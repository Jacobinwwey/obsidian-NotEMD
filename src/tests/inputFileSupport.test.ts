import { loadPdfJs } from 'obsidian';
import {
    getAllowedInputExtensionsForTask,
    isDeveloperRelaxedInputModeEnabled,
    isSupportedInputFileForTask,
    readSupportedInputFile
} from '../inputFileSupport';
import { mockApp } from './__mocks__/app';
import { mockSettings } from './__mocks__/settings';

describe('input file support', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('keeps relaxed input mode disabled unless both developer mode and the setting are enabled', () => {
        expect(isDeveloperRelaxedInputModeEnabled(mockSettings)).toBe(false);
        expect(isDeveloperRelaxedInputModeEnabled({
            ...mockSettings,
            enableDeveloperMode: true
        })).toBe(false);
        expect(isDeveloperRelaxedInputModeEnabled({
            ...mockSettings,
            enableRelaxedInputFileTypes: true
        })).toBe(false);
        expect(isDeveloperRelaxedInputModeEnabled({
            ...mockSettings,
            enableDeveloperMode: true,
            enableRelaxedInputFileTypes: true
        })).toBe(true);
    });

    test('only enables pdf for allowlisted read-only tasks when relaxed input mode is on', () => {
        const pdfFile = {
            name: 'Topic.pdf',
            path: 'Docs/Topic.pdf',
            extension: 'pdf'
        } as any;
        const relaxedSettings = {
            ...mockSettings,
            enableDeveloperMode: true,
            enableRelaxedInputFileTypes: true
        };

        expect(isSupportedInputFileForTask(mockSettings, 'translate-current-file', pdfFile)).toBe(false);
        expect(isSupportedInputFileForTask(relaxedSettings, 'translate-current-file', pdfFile)).toBe(true);
        expect(isSupportedInputFileForTask(relaxedSettings, 'extract-concepts-current', pdfFile)).toBe(true);
        expect(isSupportedInputFileForTask(relaxedSettings, 'generate-diagram', pdfFile)).toBe(true);
        expect(isSupportedInputFileForTask(relaxedSettings, 'process-current-add-links', pdfFile)).toBe(false);
        expect(isSupportedInputFileForTask(relaxedSettings, 'extract-original-text', pdfFile)).toBe(false);
        expect(isSupportedInputFileForTask(relaxedSettings, 'split-note-by-chapters', pdfFile)).toBe(false);
    });

    test('returns expanded batch input extensions only for allowlisted tasks', () => {
        const relaxedSettings = {
            ...mockSettings,
            enableDeveloperMode: true,
            enableRelaxedInputFileTypes: true
        };

        expect(getAllowedInputExtensionsForTask(relaxedSettings, 'batch-translate-folder')).toContain('pdf');
        expect(getAllowedInputExtensionsForTask(relaxedSettings, 'extract-concepts-folder')).toContain('pdf');
        expect(getAllowedInputExtensionsForTask(relaxedSettings, 'process-folder-add-links')).toEqual(['md', 'txt']);
    });

    test('reads text-like files through vault.read', async () => {
        const file = {
            name: 'Topic.json',
            path: 'Docs/Topic.json',
            extension: 'json'
        } as any;
        const relaxedSettings = {
            ...mockSettings,
            enableDeveloperMode: true,
            enableRelaxedInputFileTypes: true
        };

        (mockApp.vault.read as jest.Mock).mockResolvedValue('{"topic":"value"}');

        await expect(readSupportedInputFile(mockApp, file, relaxedSettings)).resolves.toBe('{"topic":"value"}');
        expect(mockApp.vault.read).toHaveBeenCalledWith(file);
    });

    test.each([
        ['drawio', 'diagram.drawio'],
        ['drawnix', 'diagram.drawnix'],
        ['tex', 'circuit.tex'],
        ['tikz', 'circuit.tikz']
    ])('reads source-only diagram artifact files as text for preview: .%s', async (extension, name) => {
        const file = {
            name,
            path: `Docs/${name}`,
            extension
        } as any;
        const settings = {
            ...mockSettings,
            enableDeveloperMode: false,
            enableRelaxedInputFileTypes: false
        };

        (mockApp.vault.read as jest.Mock).mockResolvedValue('source artifact');

        await expect(readSupportedInputFile(mockApp, file, settings)).resolves.toBe('source artifact');
        expect(mockApp.vault.read).toHaveBeenCalledWith(file);
    });

    test('extracts pdf text through Obsidian PDF.js when relaxed input mode is on', async () => {
        const file = {
            name: 'Topic.pdf',
            path: 'Docs/Topic.pdf',
            extension: 'pdf'
        } as any;
        const relaxedSettings = {
            ...mockSettings,
            enableDeveloperMode: true,
            enableRelaxedInputFileTypes: true
        };
        const getTextContent = jest
            .fn()
            .mockResolvedValueOnce({ items: [{ str: 'Page' }, { str: 'One' }] })
            .mockResolvedValueOnce({ items: [{ str: 'Page' }, { str: 'Two' }] });
        const getPage = jest
            .fn()
            .mockResolvedValueOnce({ getTextContent })
            .mockResolvedValueOnce({ getTextContent });

        (mockApp.vault.readBinary as jest.Mock).mockResolvedValue(new ArrayBuffer(8));
        (loadPdfJs as jest.Mock).mockResolvedValue({
            getDocument: jest.fn(() => ({
                promise: Promise.resolve({
                    numPages: 2,
                    getPage
                })
            }))
        });

        await expect(readSupportedInputFile(mockApp, file, relaxedSettings)).resolves.toBe(
            'Page One\n\n--- PDF PAGE BREAK ---\n\nPage Two'
        );
        expect(mockApp.vault.readBinary).toHaveBeenCalledWith(file);
        expect(loadPdfJs).toHaveBeenCalled();
    });

    test('rejects pdf when relaxed input mode is off', async () => {
        const file = {
            name: 'Topic.pdf',
            path: 'Docs/Topic.pdf',
            extension: 'pdf'
        } as any;

        await expect(readSupportedInputFile(mockApp, file, mockSettings)).rejects.toThrow(
            'Unsupported input file type: .pdf'
        );
    });
});
