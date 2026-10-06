jest.mock('../slideExport/slidevExporter', () => ({ exportSlidevPdf: jest.fn(), exportSlidevPng: jest.fn() }));
jest.mock('../slideExport/pptxExporter', () => ({ exportSlidevPptxFromHtml: jest.fn() }));
jest.mock('../slideExport/videoExporter', () => ({ exportVideoMp4: jest.fn() }));
import { exportPreparedSlidevFormats } from '../slideExport/slideExportBatch';
import { normalizeSlideExportFormats } from '../slideExport/slideExportFormats';
import { exportSlidevPdf, exportSlidevPng } from '../slideExport/slidevExporter';
import { exportVideoMp4 } from '../slideExport/videoExporter';
import type { SlideExportConfig } from '../slideExport/types';

const config = { format: 'html' } as SlideExportConfig;
const source = { inputFilePath: 'deck.md', outputBasename: 'deck', sourceLabel: 'deck' };
beforeEach(() => jest.resetAllMocks());
test('normalizes persisted selections and preserves legacy scalar preferences', () => {
    expect(normalizeSlideExportFormats(undefined, 'pptx')).toEqual(['pptx']);
    expect(normalizeSlideExportFormats(['png', 'bad', 'png', 'pdf'], 'html')).toEqual(['png', 'pdf']);
    expect(normalizeSlideExportFormats([], 'invalid')).toEqual(['html']);
});
test('shares the PNG sequence even when MP4 is selected before PNG', async () => {
    (exportSlidevPng as jest.Mock).mockResolvedValue('deck/png');
    (exportVideoMp4 as jest.Mock).mockResolvedValue('deck.mp4');
    const batch = await exportPreparedSlidevFormats({} as any, source, config, ['mp4', 'png', 'html'], 'deck.html');
    expect(exportSlidevPng).toHaveBeenCalledTimes(1);
    expect(batch.status).toBe('completed');
    expect(batch.outputs.map(output => output.status === 'completed' ? output.path : undefined)).toEqual(['deck.mp4', 'deck/png', 'deck.html']);
});
test('retains successes and continues independent exports after a failure', async () => {
    (exportSlidevPdf as jest.Mock).mockRejectedValue(new Error('PDF failed'));
    const batch = await exportPreparedSlidevFormats({} as any, source, config, ['pdf', 'html'], 'deck.html');
    expect(batch.status).toBe('partial');
    expect(batch.outputs).toEqual([
        { format: 'pdf', status: 'failed', error: 'PDF failed' },
        { format: 'html', status: 'completed', path: 'deck.html' },
    ]);
});
test('a failed PNG dependency is retained for MP4 without a duplicate attempt', async () => {
    (exportSlidevPng as jest.Mock).mockRejectedValue(new Error('capture failed'));
    const batch = await exportPreparedSlidevFormats({} as any, source, config, ['png', 'mp4'], 'deck.html');
    expect(batch.status).toBe('failed');
    expect(exportSlidevPng).toHaveBeenCalledTimes(1);
    expect(exportVideoMp4).not.toHaveBeenCalled();
});
test('cancellation stops remaining exporters and preserves prior output', async () => {
    const batch = await exportPreparedSlidevFormats({} as any, source, config, ['html', 'pdf', 'png'], 'deck.html', undefined, () => true);
    expect(batch.status).toBe('cancelled');
    expect(batch.outputs.every(output => output.status === 'cancelled')).toBe(true);
    expect(exportSlidevPdf).not.toHaveBeenCalled();
    expect(exportSlidevPng).not.toHaveBeenCalled();
});
test('AbortError stops later formats instead of continuing as an independent failure', async () => {
    const abort = new Error('Cancelled');
    abort.name = 'AbortError';
    (exportSlidevPdf as jest.Mock).mockRejectedValue(abort);
    const batch = await exportPreparedSlidevFormats({} as any, source, config, ['html', 'pdf', 'png'], 'deck.html');
    expect(batch.status).toBe('cancelled');
    expect(batch.outputs.map(output => output.status)).toEqual(['completed', 'cancelled', 'cancelled']);
    expect(exportSlidevPng).not.toHaveBeenCalled();
});
