import { ProgressReporter } from '../types';
import {
    completeArtifactDiagramCommand,
    completeMermaidDiagramCommand,
    MissingVegaLiteFenceError,
    previewVegaLiteArtifactFromMarkdown
} from '../operations/diagramCommandHostAdapter';

function createReporter(): ProgressReporter {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        requestCancel: jest.fn(),
        clearDisplay: jest.fn(),
        get cancelled() {
            return false;
        },
        abortController: new AbortController(),
        activeTasks: 0,
        updateActiveTasks: jest.fn()
    };
}

function createHost() {
    const savedFile = { path: 'Notes/Topic_diagram.md' } as any;

    return {
        savedFile,
        host: {
            saveMermaidSummary: jest.fn().mockResolvedValue(savedFile.path),
            saveArtifact: jest.fn().mockResolvedValue(savedFile.path),
            getFileByPath: jest.fn().mockReturnValue(savedFile),
            openFile: jest.fn(),
            maybeAutoFixMermaid: jest.fn().mockResolvedValue(undefined),
            supportsPreview: jest.fn().mockReturnValue(true),
            openPreview: jest.fn(),
            notify: jest.fn()
        }
    };
}

describe('diagram command host adapter', () => {
    test('completes mermaid save flow through injected host side effects', async () => {
        const reporter = createReporter();
        const { host, savedFile } = createHost();
        const file = { path: 'Notes/Topic.md' } as any;

        const outputPath = await completeMermaidDiagramCommand({
            host,
            file,
            reporter,
            mermaidContent: 'graph TD',
            actionLabel: 'Summarise as Mermaid diagram',
            completeNotice: 'done',
            autoFixAfterGenerate: true,
            getStepStatusText: (current, total, label) => `${label}:${current}/${total}`,
            getActionCompleteText: (label) => `${label}:complete`
        });

        expect(outputPath).toBe(savedFile.path);
        expect(host.saveMermaidSummary).toHaveBeenCalledWith(file, 'graph TD', reporter);
        expect(host.maybeAutoFixMermaid).toHaveBeenCalledWith(savedFile, reporter, 'summarise as mermaid');
        expect(host.openFile).toHaveBeenCalledWith(savedFile);
        expect(host.notify).toHaveBeenCalledWith('done');
    });

    test('completes artifact preview flow without saving files', async () => {
        const reporter = createReporter();
        const { host } = createHost();
        const file = { path: 'Notes/Topic.md' } as any;

        const outputPath = await completeArtifactDiagramCommand({
            host,
            file,
            reporter,
            result: {
                spec: { intent: 'dataChart' },
                artifact: {
                    target: 'vega-lite',
                    content: '{"mark":"bar"}',
                    mimeType: 'application/json',
                    sourceIntent: 'dataChart'
                }
            } as any,
            actionLabel: 'Preview diagram',
            executionMode: 'preview-artifact',
            completeNotice: 'saved',
            previewReadyNotice: 'preview',
            manualFixHintNotice: 'manual-fix',
            autoFixAfterGenerate: true,
            getStepStatusText: (current, total, label) => `${label}:${current}/${total}`,
            getActionCompleteText: (label) => `${label}:complete`
        });

        expect(outputPath).toBeUndefined();
        expect(host.saveArtifact).not.toHaveBeenCalled();
        expect(host.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'vega-lite' }),
            file.path,
            false
        );
        expect(host.notify).toHaveBeenCalledWith('preview');
    });

    test('completes artifact save flow, opens saved file, and previews previewable artifacts', async () => {
        const reporter = createReporter();
        const { host, savedFile } = createHost();
        const file = { path: 'Notes/Topic.md' } as any;

        const outputPath = await completeArtifactDiagramCommand({
            host,
            file,
            reporter,
            result: {
                renderError: 'needs manual cleanup',
                spec: { intent: 'mindmap' },
                artifact: {
                    target: 'mermaid',
                    content: 'graph TD',
                    mimeType: 'text/vnd.mermaid',
                    sourceIntent: 'mindmap'
                }
            } as any,
            actionLabel: 'Generate diagram',
            executionMode: 'save-artifact',
            completeNotice: 'saved',
            previewReadyNotice: 'preview',
            manualFixHintNotice: 'manual-fix',
            autoFixAfterGenerate: true,
            getStepStatusText: (current, total, label) => `${label}:${current}/${total}`,
            getActionCompleteText: (label) => `${label}:complete`
        });

        expect(outputPath).toBe(savedFile.path);
        expect(host.notify).toHaveBeenCalledWith('manual-fix', 8000);
        expect(host.saveArtifact).toHaveBeenCalledWith(
            file,
            expect.objectContaining({ target: 'mermaid' }),
            reporter
        );
        expect(host.maybeAutoFixMermaid).toHaveBeenCalledWith(savedFile, reporter, 'experimental diagram generation');
        expect(host.openFile).toHaveBeenCalledWith(savedFile);
        expect(host.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'mermaid' }),
            savedFile.path,
            true
        );
    });

    test('extracts vega-lite fence and opens preview artifact', () => {
        const { host } = createHost();
        const artifact = previewVegaLiteArtifactFromMarkdown({
            host,
            sourceMarkdown: '# Chart\n\n```vega-lite\n{\"mark\":\"bar\"}\n```\n',
            sourcePath: 'Notes/Topic.md'
        });

        expect(artifact).toEqual(expect.objectContaining({
            target: 'vega-lite',
            content: '{"mark":"bar"}'
        }));
        expect(host.openPreview).toHaveBeenCalledWith(artifact, 'Notes/Topic.md', false);
    });

    test('throws typed error when vega-lite fence is missing', () => {
        const { host } = createHost();

        expect(() => previewVegaLiteArtifactFromMarkdown({
            host,
            sourceMarkdown: '# Chart',
            sourcePath: 'Notes/Topic.md'
        })).toThrow(MissingVegaLiteFenceError);
    });
});
