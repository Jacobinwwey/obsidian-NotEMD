import type { App } from 'obsidian';
import type { ExportProgressCallback, SlideExportConfig, SlideExportFormat, SlidevExportSource } from './types';
import { exportSlidevPdf, exportSlidevPng } from './slidevExporter';
import { exportSlidevPptxFromHtml } from './pptxExporter';
import { exportVideoMp4 } from './videoExporter';

export type SlideFormatOutcome =
    | { format: SlideExportFormat; status: 'completed'; path: string; reportPath?: string }
    | { format: SlideExportFormat; status: 'failed' | 'cancelled'; error: string };

/** Export one prepared, converged deck; retain all outcomes even if one format fails. */
export async function exportPreparedSlidevFormats(
    app: App,
    source: SlidevExportSource,
    config: SlideExportConfig,
    formats: readonly SlideExportFormat[],
    htmlPath: string,
    onProgress?: ExportProgressCallback,
    isCancelled: () => boolean = () => false
): Promise<{ status: 'completed' | 'partial' | 'failed' | 'cancelled'; outputs: SlideFormatOutcome[] }> {
    if (!formats.length) throw new Error('No slide export formats selected');
    const outputs: SlideFormatOutcome[] = [];
    let cancelled = false;
    // A rejected capture is shared too: retrying it for MP4 would hide the original failure.
    let pngSequence: Promise<string> | undefined;
    const getPngSequence = () => pngSequence ??= exportSlidevPng(app, source, { ...config, format: 'png' }, onProgress);
    for (const format of formats) {
        cancelled ||= isCancelled();
        if (cancelled) {
            outputs.push({ format, status: 'cancelled', error: 'Export cancelled' });
            onProgress?.('export-cancelled', format.toUpperCase());
            continue;
        }
        const formatConfig = { ...config, format };
        onProgress?.('export', format.toUpperCase());
        try {
            let path: string;
            let reportPath: string | undefined;
            switch (format) {
                case 'html': path = htmlPath; break;
                case 'pdf': path = await exportSlidevPdf(app, source, formatConfig, onProgress); break;
                case 'png': path = await getPngSequence(); break;
                case 'pptx': {
                    const pptx = await exportSlidevPptxFromHtml(app, source, formatConfig, htmlPath, onProgress);
                    path = pptx.path;
                    reportPath = pptx.reportPath;
                    break;
                }
                case 'mp4': {
                    const pngDirectory = await getPngSequence();
                    if (isCancelled()) {
                        const cancellation = new Error('Export cancelled');
                        cancellation.name = 'AbortError';
                        throw cancellation;
                    }
                    path = await exportVideoMp4(app, pngDirectory, source.outputBasename, formatConfig, onProgress);
                    break;
                }
            }
            outputs.push({ format, status: 'completed', path, ...(reportPath ? { reportPath } : {}) });
            onProgress?.('export-completed', `${format.toUpperCase()}: ${path}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            cancelled = isCancelled() || (error instanceof Error && error.name === 'AbortError');
            outputs.push({ format, status: cancelled ? 'cancelled' : 'failed', error: message });
            onProgress?.(cancelled ? 'export-cancelled' : 'export-failed', `${format.toUpperCase()}: ${message}`);
        }
    }
    const completed = outputs.filter(output => output.status === 'completed').length;
    return { status: cancelled ? 'cancelled' : completed === outputs.length ? 'completed' : completed ? 'partial' : 'failed', outputs };
}
