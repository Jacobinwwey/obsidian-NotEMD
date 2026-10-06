import type { SlideExportFormat } from './types';

export const SLIDE_EXPORT_FORMATS: readonly SlideExportFormat[] = ['html', 'pdf', 'png', 'pptx', 'mp4'];

/** Validate persisted settings once, preserving scalar preferences from older versions. */
export function normalizeSlideExportFormats(selection: unknown, legacyFormat: unknown): SlideExportFormat[] {
    const isFormat = (format: unknown): format is SlideExportFormat =>
        typeof format === 'string' && SLIDE_EXPORT_FORMATS.includes(format as SlideExportFormat);
    const formats = Array.isArray(selection) ? [...new Set(selection.filter(isFormat))] : [];
    return formats.length ? formats : [isFormat(legacyFormat) ? legacyFormat : 'html'];
}
