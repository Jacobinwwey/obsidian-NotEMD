import { runPreviewDiagramCommandWithHost, isDirectPreviewableDiagramExtension } from '../operations/diagramCommandHostAdapter';
import { STRINGS_EN } from '../i18n/locales/en';

describe('binary diagram previews', () => {
    function setup(extension: string, bytes: number[]) {
        const file = { path: `diagram.${extension}`, name: `diagram.${extension}`, extension } as any;
        const diagramHost = { readBinary: jest.fn(async () => new Uint8Array(bytes).buffer), openFile: jest.fn(async () => {}), notify: jest.fn() };
        const reporter = { log: jest.fn(), updateStatus: jest.fn() } as any;
        const host = {
            getUiStrings: () => STRINGS_EN, getSettings: jest.fn(), isBusy: () => false,
            getBusyNotice: () => '', startReporterAction: jest.fn(), finalizeReporter: jest.fn(),
            getActionLabel: () => 'Preview', getActionCompleteText: () => 'Complete', getActionFailedText: () => 'Failed',
            readFile: jest.fn(async () => { throw new Error('Binary must never be decoded as text'); }),
            createDiagramHostAdapter: () => diagramHost, saveErrorLog: jest.fn(), logError: jest.fn(),
        } as any;
        return { file, diagramHost, reporter, host };
    }
    test.each([['png', [137,80,78,71,13,10,26,10]], ['pdf', [37,80,68,70,45,49,46,55]]])('opens %s through the native viewer without text decoding', async (extension, bytes) => {
        const { file, diagramHost, reporter, host } = setup(extension as string, bytes as number[]);
        expect(isDirectPreviewableDiagramExtension(extension as string)).toBe(true);
        const result = await runPreviewDiagramCommandWithHost(host, file, reporter);
        expect(result?.kind).toBe('binary-preview');
        expect(host.readFile).not.toHaveBeenCalled();
        expect(diagramHost.openFile).toHaveBeenCalledWith(file);
        expect(host.finalizeReporter).toHaveBeenCalled();
    });
    test('rejects invalid binary and propagates viewer failures', async () => {
        const invalid = setup('png', [1,2,3]);
        expect((await runPreviewDiagramCommandWithHost(invalid.host, invalid.file, invalid.reporter))?.kind).toBe('error');
        expect(invalid.diagramHost.openFile).not.toHaveBeenCalled();
        const valid = setup('pdf', [37,80,68,70,45]);
        valid.diagramHost.openFile.mockRejectedValue(new Error('Viewer failed'));
        expect(await runPreviewDiagramCommandWithHost(valid.host, valid.file, valid.reporter)).toMatchObject({ kind: 'error', errorMessage: 'Viewer failed' });
    });
});
