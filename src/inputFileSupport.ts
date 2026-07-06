import { App, TFile, loadPdfJs } from 'obsidian';
import { NotemdSettings } from './types';

export type RestrictedInputTaskId =
    | 'process-current-add-links'
    | 'process-folder-add-links'
    | 'generate-from-title'
    | 'batch-generate-from-titles'
    | 'research-and-summarize'
    | 'extract-original-text'
    | 'batch-extract-original-text'
    | 'split-note-by-chapters'
    | 'fix-formula-current'
    | 'batch-fix-formula'
    | 'batch-mermaid-fix';

export type RelaxedInputTaskId =
    | 'translate-current-file'
    | 'batch-translate-folder'
    | 'extract-concepts-current'
    | 'extract-concepts-folder'
    | 'summarize-as-mermaid'
    | 'generate-diagram'
    | 'check-duplicates-current';

export type SupportedInputTaskId = RestrictedInputTaskId | RelaxedInputTaskId;

const STRICT_MARKDOWN_ONLY_TASKS = new Set<SupportedInputTaskId>([
    'generate-from-title',
    'batch-generate-from-titles',
    'research-and-summarize',
    'split-note-by-chapters',
    'batch-mermaid-fix',
    'summarize-as-mermaid',
    'generate-diagram'
]);

const STRICT_MARKDOWN_OR_TEXT_TASKS = new Set<SupportedInputTaskId>([
    'process-current-add-links',
    'process-folder-add-links',
    'extract-original-text',
    'batch-extract-original-text',
    'fix-formula-current',
    'batch-fix-formula',
    'translate-current-file',
    'batch-translate-folder',
    'extract-concepts-current',
    'extract-concepts-folder',
    'check-duplicates-current'
]);

const TEXT_INPUT_EXTENSIONS = new Set([
    'md',
    'markdown',
    'txt',
    'text',
    'mdx',
    'csv',
    'tsv',
    'json',
    'jsonl',
    'yaml',
    'yml',
    'xml',
    'html',
    'htm',
    'canvas',
    'drawio',
    'drawnix',
    'mermaid',
    'mmd',
    'svg',
    'tex',
    'tikz',
    'log'
]);

const DEVELOPER_RELAXED_INPUT_EXTENSIONS = new Set([
    ...TEXT_INPUT_EXTENSIONS,
    'pdf'
]);

const PDF_PAGE_SEPARATOR = '\n\n--- PDF PAGE BREAK ---\n\n';

export function normalizeFileExtension(file: Pick<TFile, 'extension' | 'name' | 'path'>): string {
    if (typeof file.extension === 'string' && file.extension.trim().length > 0) {
        return file.extension.trim().toLowerCase();
    }

    const fallback = file.name || file.path || '';
    const derived = fallback.includes('.') ? fallback.split('.').pop() || '' : '';
    return derived.trim().toLowerCase();
}

export function isDeveloperRelaxedInputModeEnabled(
    settings: Pick<NotemdSettings, 'enableDeveloperMode' | 'enableRelaxedInputFileTypes'>
): boolean {
    return settings.enableDeveloperMode && settings.enableRelaxedInputFileTypes;
}

export function getAllowedInputExtensionsForTask(
    settings: Pick<NotemdSettings, 'enableDeveloperMode' | 'enableRelaxedInputFileTypes'>,
    taskId: SupportedInputTaskId
): string[] {
    const developerRelaxed = isDeveloperRelaxedInputModeEnabled(settings);
    const strictAllowedExtensions = STRICT_MARKDOWN_ONLY_TASKS.has(taskId)
        ? ['md']
        : STRICT_MARKDOWN_OR_TEXT_TASKS.has(taskId)
            ? ['md', 'txt']
            : ['md', 'txt'];

    if (!developerRelaxed) {
        return strictAllowedExtensions;
    }

    switch (taskId) {
        case 'translate-current-file':
        case 'batch-translate-folder':
        case 'extract-concepts-current':
        case 'extract-concepts-folder':
        case 'check-duplicates-current':
            return Array.from(DEVELOPER_RELAXED_INPUT_EXTENSIONS);
        case 'summarize-as-mermaid':
        case 'generate-diagram':
            return Array.from(DEVELOPER_RELAXED_INPUT_EXTENSIONS);
        default:
            return strictAllowedExtensions;
    }
}

export function isSupportedInputFileForTask(
    settings: Pick<NotemdSettings, 'enableDeveloperMode' | 'enableRelaxedInputFileTypes'>,
    taskId: SupportedInputTaskId,
    file: Pick<TFile, 'extension' | 'name' | 'path'>
): boolean {
    const extension = normalizeFileExtension(file);
    return getAllowedInputExtensionsForTask(settings, taskId).includes(extension);
}

export function getDeveloperRelaxedInputTaskList(): RelaxedInputTaskId[] {
    return [
        'translate-current-file',
        'batch-translate-folder',
        'extract-concepts-current',
        'extract-concepts-folder',
        'summarize-as-mermaid',
        'generate-diagram',
        'check-duplicates-current'
    ];
}

function decodePdfTextItemText(item: any): string {
    if (!item) {
        return '';
    }

    if (typeof item.str === 'string') {
        return item.str;
    }

    return '';
}

async function extractPdfText(app: App, file: TFile): Promise<string> {
    const pdfjsLib = await loadPdfJs();
    const binary = await app.vault.readBinary(file);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(binary) });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const items = Array.isArray(textContent.items) ? textContent.items : [];
        const pageText = items
            .map(decodePdfTextItemText)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (pageText) {
            pages.push(pageText);
        }
    }

    return pages.join(PDF_PAGE_SEPARATOR).trim();
}

export async function readSupportedInputFile(
    app: App,
    file: TFile,
    settings: Pick<NotemdSettings, 'enableDeveloperMode' | 'enableRelaxedInputFileTypes'>
): Promise<string> {
    const extension = normalizeFileExtension(file);

    if (TEXT_INPUT_EXTENSIONS.has(extension)) {
        return app.vault.read(file);
    }

    if (extension === 'pdf' && isDeveloperRelaxedInputModeEnabled(settings)) {
        return extractPdfText(app, file);
    }

    throw new Error(`Unsupported input file type: .${extension || 'unknown'}`);
}
