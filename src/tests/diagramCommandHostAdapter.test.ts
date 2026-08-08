import { STRINGS_EN } from '../i18n/locales/en';
import {
    completeArtifactDiagramCommand,
    previewVegaLiteArtifactFromMarkdown,
    runGenerateDiagramCommandWithHost,
    runPreviewDiagramCommandWithHost
} from '../operations/diagramCommandHostAdapter';
import { mockSettings } from './__mocks__/settings';

function createReporter() {
    return {
        log: jest.fn(),
        updateStatus: jest.fn(),
        clearDisplay: jest.fn(),
        cancelled: false
    };
}

function createDiagramHost() {
    const reporter = createReporter();
    const diagramHost = {
        saveMermaidSummary: jest.fn(),
        saveArtifact: jest.fn(),
        getFileByPath: jest.fn(),
        openFile: jest.fn(),
        maybeAutoFixMermaid: jest.fn(),
        supportsPreview: jest.fn(() => true),
        openPreview: jest.fn(),
        notify: jest.fn()
    };

    return {
        reporter,
        diagramHost,
        host: {
            loadSettings: jest.fn().mockResolvedValue(undefined),
            getSettings: jest.fn(() => mockSettings),
            getUiStrings: jest.fn(() => STRINGS_EN),
            getReporter: jest.fn(() => reporter),
            isBusy: jest.fn(() => false),
            setBusy: jest.fn(),
            getBusyNotice: jest.fn(() => 'busy now'),
            startReporterAction: jest.fn(),
            finalizeReporter: jest.fn(),
            getActionLabel: jest.fn((mode: string) => mode === 'save-artifact' ? 'Generate diagram' : 'Preview diagram'),
            getActionCompleteText: jest.fn((label: string) => `Completed ${label}`),
            getActionFailedText: jest.fn((message: string) => `Failed: ${message}`),
            readFile: jest.fn().mockResolvedValue('# Topic'),
            getProviderAndModelForTask: jest.fn(() => ({
                provider: mockSettings.providers[0],
                modelName: mockSettings.providers[0].model
            })),
            getTaskLanguageCode: jest.fn(() => 'en'),
            executeSaveMermaidCommand: jest.fn(),
            executeArtifactCommand: jest.fn().mockResolvedValue({
                generation: {
                    plan: { intent: 'canvasMap' },
                    spec: { intent: 'canvasMap' },
                    artifact: {
                        target: 'json-canvas',
                        content: '{}',
                        mimeType: 'application/json',
                        sourceIntent: 'canvasMap'
                    }
                },
                followThrough: {
                    kind: 'save-artifact',
                    outputPath: 'Notes/Topic_diagram.canvas',
                    previewOpened: true,
                    autoFixAttempted: false,
                    artifactTarget: 'json-canvas'
                },
                localKnowledgeContextUsed: true,
                localKnowledgeRetrieval: {
                    indexedFileCount: 2,
                    indexedSectionCount: 5,
                    matchedSectionCount: 1,
                    returnedHitCount: 1,
                    expandedSectionCount: 1,
                    sourcePaths: ['Knowledge/Reference.md'],
                    usedSlidingWindowSize: 0,
                    requestedTopK: 3,
                    indexBuildMs: 9,
                    queryMs: 4,
                    contextCharCount: 64,
                    excludeCurrentFileApplied: true,
                    excludedCurrentFileHitCount: 0
                },
                outputPath: 'Notes/Topic_diagram.canvas',
                previewOpened: true
            }),
            createDiagramHostAdapter: jest.fn(() => diagramHost),
            saveErrorLog: jest.fn().mockResolvedValue(undefined),
            logError: jest.fn()
        }
    };
}

describe('diagram command host adapter', () => {
    test('busy generate wrapper short-circuits before reading file or running generation', async () => {
        const { host, reporter } = createDiagramHost();
        host.isBusy.mockReturnValue(true);
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };

        const result = await runGenerateDiagramCommandWithHost(host as any, file as any, reporter as any, {
            executionMode: 'save-artifact'
        });

        expect(result).toBeNull();
        expect(host.readFile).not.toHaveBeenCalled();
        expect(host.createDiagramHostAdapter().notify).toHaveBeenCalledWith('busy now');
    });

    test('generate wrapper returns follow-through details from the execution host', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };

        const result = await runGenerateDiagramCommandWithHost(host as any, file as any, reporter as any, {
            executionMode: 'save-artifact'
        });

        expect(result).toEqual({
            kind: 'success',
            executionMode: 'save-artifact',
            sourcePath: 'Notes/Topic.md',
            actionLabel: 'Generate diagram',
            operationInput: expect.objectContaining({
                sourcePath: 'Notes/Topic.md',
                outputMode: 'artifact'
            }),
            generation: expect.objectContaining({
                artifact: expect.objectContaining({ target: 'json-canvas' })
            }),
            followThrough: {
                kind: 'save-artifact',
                outputPath: 'Notes/Topic_diagram.canvas',
                previewOpened: true,
                autoFixAttempted: false,
                artifactTarget: 'json-canvas'
            },
            localKnowledgeContextUsed: true,
            localKnowledgeRetrieval: {
                indexedFileCount: 2,
                indexedSectionCount: 5,
                matchedSectionCount: 1,
                returnedHitCount: 1,
                expandedSectionCount: 1,
                sourcePaths: ['Knowledge/Reference.md'],
                usedSlidingWindowSize: 0,
                requestedTopK: 3,
                indexBuildMs: 9,
                queryMs: 4,
                contextCharCount: 64,
                excludeCurrentFileApplied: true,
                excludedCurrentFileHitCount: 0
            },
            outputPath: 'Notes/Topic_diagram.canvas',
            previewOpened: true
        });
    });

    test('preview wrapper finalizes reporter and returns artifact metadata', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };
        host.readFile.mockResolvedValue('# Chart\n\n```vega-lite\n{\"mark\":\"bar\"}\n```');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic.md',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'vega-lite'
            })
        });
        expect(host.finalizeReporter).toHaveBeenCalledWith(reporter);
        expect(host.createDiagramHostAdapter().notify).toHaveBeenCalledWith('Diagram preview is ready!');
    });

    test('preview wrapper preserves every Mermaid fence in source order', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture.md', path: 'Notes/Architecture.md' };
        host.readFile.mockResolvedValue([
            '# Architecture',
            '',
            '```mermaid',
            'flowchart TD',
            'A --> B',
            '```',
            '',
            'interstitial text',
            '',
            '```mermaid',
            'sequenceDiagram',
            'Alice->>Bob: Hello',
            '```'
        ].join('\n'));

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                target: 'mermaid',
                previewPanels: [
                    expect.objectContaining({
                        id: 'mermaid-1',
                        artifact: expect.objectContaining({
                            content: expect.stringContaining('flowchart TD')
                        })
                    }),
                    expect.objectContaining({
                        id: 'mermaid-2',
                        artifact: expect.objectContaining({
                            content: expect.stringContaining('sequenceDiagram')
                        })
                    })
                ]
            })
        });
        expect(diagramHost.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                previewPanels: expect.arrayContaining([
                    expect.objectContaining({ id: 'mermaid-1' }),
                    expect.objectContaining({ id: 'mermaid-2' })
                ])
            }),
            file.path,
            false
        );
    });

    test('preview helper keeps using markdown vega-lite fence extraction for direct preview', () => {
        const { diagramHost } = createDiagramHost();
        const artifact = previewVegaLiteArtifactFromMarkdown({
            host: diagramHost as any,
            sourceMarkdown: '# Chart\n\n```vega-lite\n{\"mark\":\"bar\"}\n```',
            sourcePath: 'Notes/Topic.md'
        });

        expect(artifact).toEqual(expect.objectContaining({
            target: 'vega-lite',
            mimeType: 'application/json'
        }));
        expect(diagramHost.openPreview).toHaveBeenCalled();
    });

    test('preview wrapper supports saved canvas artifacts directly', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_diagram.canvas', path: 'Notes/Topic_diagram.canvas' };
        host.readFile.mockResolvedValue('{"nodes":[],"edges":[]}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_diagram.canvas',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'json-canvas'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'json-canvas' }),
            'Notes/Topic_diagram.canvas',
            true
        );
    });

    test('preview wrapper supports raw saved mermaid markdown artifacts directly', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic_summ.md', path: 'Notes/Topic_summ.md' };
        host.readFile.mockResolvedValue('flowchart TD\nA --> B');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic_summ.md',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'mermaid',
                sourceIntent: 'flowchart'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'mermaid' }),
            'Notes/Topic_summ.md',
            true
        );
    });

    test('passes an explicit CircuitikZ render target through the command boundary', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };

        await runGenerateDiagramCommandWithHost(host as any, file as any, reporter as any, {
            executionMode: 'save-artifact',
            inputOverrides: {
                requestedIntent: 'circuit',
                requestedRenderTarget: 'circuitikz'
            }
        });

        expect(host.executeArtifactCommand).toHaveBeenCalledWith(
            file,
            expect.objectContaining({
                requestedIntent: 'circuit',
                requestedRenderTarget: 'circuitikz'
            }),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            expect.anything(),
            STRINGS_EN,
            'save-artifact'
        );
    });

    test('preview wrapper supports saved circuitikz tex artifacts as source-only previews', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Inverter_diagram.tex', path: 'Notes/Inverter_diagram.tex' };
        host.readFile.mockResolvedValue('\\usepackage{circuitikz}\n\\begin{document}\n\\begin{circuitikz}\n\\draw (0,0) to[short] (1,0);\n\\end{circuitikz}\n\\end{document}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Inverter_diagram.tex',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'circuitikz',
                mimeType: 'text/x-tex',
                sourceIntent: 'circuit'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'circuitikz',
                content: expect.stringContaining('\\begin{circuitikz}')
            }),
            'Notes/Inverter_diagram.tex',
            true
        );
    });

    test('resolves generated circuitikz preview notes back to the typed source artifact', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Inverter_diagram.tex.md', path: 'Notes/Inverter_diagram.tex.md' };
        host.readFile.mockResolvedValue([
            '# Inverter diagram preview',
            '',
            '![[Inverter_diagram.tex.svg]]',
            '',
            'Source artifact: [[Inverter_diagram.tex]]',
            'Render target: circuitikz'
        ].join('\n'));
        diagramHost.getFileByPath.mockImplementation((path: string) => ({ path }));
        (diagramHost as any).readFile = jest.fn(async (loadedFile: { path: string }) => {
            if (loadedFile.path === 'Notes/Inverter_diagram.tex') {
                return '\\documentclass[border=8pt]{standalone}\n\\usepackage{circuitikz}\n\\begin{document}\n\\begin{circuitikz}\n\\draw (0,0) to[short] (1,0);\n\\end{circuitikz}\n\\end{document}';
            }
            if (loadedFile.path === 'Notes/Inverter_diagram.tex.svg') {
                return '<svg><text>Inverter preview</text></svg>';
            }
            return '';
        });

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                target: 'circuitikz',
                sourceIntent: 'circuit',
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Inverter preview')
                })
            })
        });
        expect(diagramHost.openPreview).toHaveBeenCalledTimes(1);
        expect(diagramHost.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({ target: 'circuitikz', sourceIntent: 'circuit' }),
            'Notes/Inverter_diagram.tex',
            true
        );
    });

    test('preview wrapper supports saved drawio artifacts as source-only previews', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawio', path: 'Notes/Architecture_diagram.drawio' };
        host.readFile.mockResolvedValue('<mxfile><diagram name="Page-1"><mxGraphModel /></diagram></mxfile>');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Architecture_diagram.drawio',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'drawio',
                mimeType: 'application/vnd.jgraph.mxfile',
                sourceIntent: 'flowchart'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'drawio',
                content: expect.stringContaining('<mxfile')
            }),
            'Notes/Architecture_diagram.drawio',
            true
        );
    });

    test('preview wrapper supports saved drawnix artifacts as source-only previews', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        host.readFile.mockResolvedValue('{"type":"drawnix","version":"1","source":"notemd","elements":[]}');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Architecture_diagram.drawnix',
            previewOpened: true,
            artifact: expect.objectContaining({
                target: 'drawnix',
                mimeType: 'application/vnd.drawnix+json',
                sourceIntent: 'flowchart'
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'drawnix',
                content: expect.stringContaining('"type":"drawnix"')
            }),
            'Notes/Architecture_diagram.drawnix',
            true
        );
    });

    test('preview wrapper exposes Drawnix Mermaid source visuals as preview panels', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        host.readFile.mockResolvedValue(JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [{ type: 'mindmap', id: 'root', children: [], data: { topic: { type: 'paragraph', children: [{ text: 'Root' }] } }, points: [[0, 0]] }],
            viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [{
                        id: 'source-visual-1',
                        kind: 'mermaid',
                        status: 'resolved',
                        sourceHash: 'abcd1234',
                        companionPaths: ['Notes/Architecture_diagram.drawnix.assets/source-visual-1.svg']
                    }]
                }
            }
        }));
        diagramHost.getFileByPath.mockImplementation((path: string) => ({ path }));
        (diagramHost as any).readFile = jest.fn(async (loadedFile: { path: string }) =>
            loadedFile.path.endsWith('source-visual-1.svg')
                ? '<svg><foreignObject x="0" y="0" width="120" height="40"><div xmlns="http://www.w3.org/1999/xhtml">Mermaid companion</div></foreignObject></svg>'
                : host.readFile.mock.results[0]?.value ?? ''
        );

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                target: 'drawnix',
                previewPanels: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'source-visual-1',
                        artifact: expect.objectContaining({
                            previewSvg: expect.objectContaining({
                                content: expect.stringContaining('Mermaid companion')
                            })
                        })
                    })
                ])
            })
        });
        const panels = (result as any).artifact.previewPanels as Array<{ id: string; artifact: { previewSvg?: { content: string } } }>;
        const mermaidPanel = panels.find(panel => panel.id === 'source-visual-1');
        expect(mermaidPanel?.artifact.previewSvg?.content).not.toContain('<foreignObject');
        expect(diagramHost.openPreview).toHaveBeenCalledTimes(1);
    });

    test('preview wrapper restores an inline Drawnix Mermaid visual without companion files', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        host.readFile.mockResolvedValue(JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [],
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [{
                        id: 'source-visual-inline',
                        kind: 'mermaid',
                        status: 'resolved',
                        sourceHash: 'inline001',
                        companionPaths: [],
                        embeddedSvg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Inline Mermaid</text></svg>',
                        title: 'Mermaid source visual 1',
                        lineStart: 1,
                        lineEnd: 3
                    }]
                }
            }
        }));
        diagramHost.getFileByPath.mockImplementation((path: string) => ({ path }));
        (diagramHost as any).readFile = jest.fn().mockResolvedValue('');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                target: 'drawnix',
                previewPanels: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'source-visual-inline',
                        artifact: expect.objectContaining({
                            previewSvg: expect.objectContaining({
                                content: expect.stringContaining('Inline Mermaid')
                            })
                        })
                    })
                ])
            })
        });
        expect(diagramHost.openPreview).toHaveBeenCalledTimes(1);
    });

    test('preview wrapper ignores unsupported Drawnix source-visual metadata versions', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        host.readFile.mockResolvedValue(JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [],
            metadata: {
                notemd: {
                    version: 2,
                    sourceVisuals: [{
                        id: 'future-visual',
                        kind: 'mermaid',
                        companionPaths: [],
                        embeddedSvg: '<svg><text>Future schema</text></svg>'
                    }]
                }
            }
        }));
        (diagramHost as any).getFileByPath.mockImplementation((path: string) => ({ path }));

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({ kind: 'success', artifact: { target: 'drawnix' } });
        expect((result as any).artifact.previewPanels).toBeUndefined();
        expect(diagramHost.openPreview).toHaveBeenCalledTimes(1);
    });

    test('preview wrapper de-duplicates repeated source-visual ids deterministically', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        host.readFile.mockResolvedValue(JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [],
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [
                        {
                            id: 'duplicate-visual',
                            kind: 'mermaid',
                            companionPaths: [],
                            embeddedSvg: '<svg><text>First</text></svg>'
                        },
                        {
                            id: 'duplicate-visual',
                            kind: 'mermaid',
                            companionPaths: [],
                            sourceContent: 'flowchart TD\nA --> B'
                        }
                    ]
                }
            }
        }));
        (diagramHost as any).getFileByPath.mockImplementation((path: string) => ({ path }));

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect((result as any).artifact.previewPanels.map((panel: { id: string }) => panel.id))
            .toEqual(['duplicate-visual']);
        expect((result as any).artifact.previewPanels[0].artifact.previewSvg.content)
            .toContain('First');
    });

    test('preview wrapper rebuilds an older Mermaid visual when its companion file is missing', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        host.readFile.mockResolvedValue(JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [],
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [{
                        id: 'source-visual-legacy',
                        kind: 'mermaid',
                        status: 'resolved',
                        sourceHash: 'legacy001',
                        companionPaths: ['Notes/Architecture_diagram.drawnix.assets/source-visual-legacy.svg'],
                        sourceContent: 'flowchart TD\nA --> B'
                    }]
                }
            }
        }));
        diagramHost.getFileByPath.mockImplementation((path: string) => ({ path }));
        (diagramHost as any).readFile = jest.fn().mockResolvedValue('');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                previewPanels: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'source-visual-legacy',
                        artifact: expect.objectContaining({
                            target: 'mermaid',
                            previewSvg: expect.objectContaining({
                                content: expect.stringContaining('<svg')
                            })
                        })
                    })
                ])
            })
        });
        expect(diagramHost.openPreview).toHaveBeenCalledTimes(1);
    });

    test('preview artifact execution attaches in-memory Drawnix Mermaid and image panels', async () => {
        const { diagramHost, reporter } = createDiagramHost();
        const imageBytes = new Uint8Array([1, 2, 3, 4]).buffer;
        const artifactContent = JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [],
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [
                        { id: 'source-visual-mermaid', kind: 'mermaid', companionPaths: ['source-visual-mermaid.svg'] },
                        { id: 'source-visual-image', kind: 'image', companionPaths: ['source-visual-image.png'] }
                    ]
                }
            }
        });

        await completeArtifactDiagramCommand({
            host: diagramHost as any,
            file: { path: 'Notes/Architecture.md' } as any,
            reporter: reporter as any,
            result: {
                spec: { intent: 'drawnixMindmap' },
                artifact: {
                    target: 'drawnix',
                    content: artifactContent,
                    mimeType: 'application/vnd.drawnix+json',
                    sourceIntent: 'drawnixMindmap',
                    previewSvg: { content: '<svg><text>Primary</text></svg>', mimeType: 'image/svg+xml' },
                    companions: [
                        { path: 'source-visual-mermaid.svg', content: '<svg><text>Mermaid</text></svg>', mimeType: 'image/svg+xml' },
                        { path: 'source-visual-image.png', content: imageBytes, mimeType: 'image/png', binary: true }
                    ]
                }
            } as any,
            actionLabel: 'Preview diagram',
            executionMode: 'preview-artifact',
            completeNotice: 'complete',
            previewReadyNotice: 'ready',
            manualFixHintNotice: 'fix',
            autoFixAfterGenerate: false,
            getStepStatusText: (step, total, label) => `${step}/${total} ${label}`,
            getActionCompleteText: label => `Completed ${label}`
        });

        expect(diagramHost.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                previewPanels: [
                    expect.objectContaining({ id: 'drawnix-primary' }),
                    expect.objectContaining({ id: 'source-visual-mermaid' }),
                    expect.objectContaining({
                        id: 'source-visual-image',
                        artifact: expect.objectContaining({
                            previewSvg: expect.objectContaining({ content: expect.stringContaining('data:image/png;base64') })
                        })
                    })
                ]
            }),
            'Notes/Architecture.md',
            false
        );
    });

    test('preview wrapper reads persisted Drawnix image companions as exportable panels', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawnix', path: 'Notes/Architecture_diagram.drawnix' };
        const imageBytes = new Uint8Array([5, 6, 7, 8]).buffer;
        const drawnix = JSON.stringify({
            type: 'drawnix',
            version: 1,
            source: 'web',
            elements: [],
            metadata: {
                notemd: {
                    version: 1,
                    sourceVisuals: [{
                        id: 'source-visual-image',
                        kind: 'image',
                        companionPaths: ['Notes/Architecture_diagram.drawnix.assets/source-visual-image.png']
                    }]
                }
            }
        });
        host.readFile.mockImplementation(async (loadedFile: { path: string }) => {
            if (loadedFile.path === file.path) return drawnix;
            if (loadedFile.path.endsWith('.drawnix.svg')) return '<svg><text>Primary</text></svg>';
            return '';
        });
        diagramHost.getFileByPath.mockImplementation((path: string) => ({ path }));
        (diagramHost as any).readBinary = jest.fn().mockResolvedValue(imageBytes);

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                previewPanels: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'source-visual-image',
                        artifact: expect.objectContaining({
                            previewSvg: expect.objectContaining({ content: expect.stringContaining('data:image/png;base64') })
                        })
                    })
                ])
            })
        });
        expect((diagramHost as any).readBinary).toHaveBeenCalled();
    });

    test('preview wrapper finds a previously generated Obsidian svg wrapper beside the source note', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Topic.md', path: 'Notes/Topic.md' };
        host.readFile.mockResolvedValue('# Topic without inline diagram');
        diagramHost.getFileByPath.mockImplementation((path: string) => {
            if (path === 'Notes/Topic_diagram.drawio.md' || path === 'Notes/Topic_diagram.drawio.svg') {
                return { path };
            }
            return null;
        });
        (diagramHost as any).readFile = jest.fn(async (loadedFile: { path: string }) => {
            if (loadedFile.path === 'Notes/Topic_diagram.drawio.md') {
                return '# Topic diagram preview\n\n![[Topic_diagram.drawio.svg]]\n';
            }
            if (loadedFile.path === 'Notes/Topic_diagram.drawio.svg') {
                return '<svg><text>Generated preview</text></svg>';
            }
            return '';
        });

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Topic.md',
            artifact: expect.objectContaining({
                target: 'html',
                content: expect.stringContaining('Generated preview'),
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Generated preview')
                })
            })
        });
        expect(diagramHost.openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'html',
                content: expect.stringContaining('Generated preview'),
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Generated preview')
                })
            }),
            'Notes/Topic_diagram.drawio.md',
            true
        );
    });

    test('preview wrapper supports saved svg artifacts with exportable svg content', async () => {
        const { host, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawio.svg', path: 'Notes/Architecture_diagram.drawio.svg' };
        host.readFile.mockResolvedValue('<svg><text>Direct SVG preview</text></svg>');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            sourcePath: 'Notes/Architecture_diagram.drawio.svg',
            artifact: expect.objectContaining({
                target: 'html',
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Direct SVG preview')
                })
            })
        });
        expect(host.createDiagramHostAdapter().openPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                target: 'html',
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Direct SVG preview')
                })
            }),
            'Notes/Architecture_diagram.drawio.svg',
            true
        );
    });

    test('preview wrapper uses companion svg when a saved drawio source has one', async () => {
        const { host, diagramHost, reporter } = createDiagramHost();
        const file = { name: 'Architecture_diagram.drawio', path: 'Notes/Architecture_diagram.drawio' };
        host.readFile.mockResolvedValue('<mxfile><diagram name="Page-1"><mxGraphModel /></diagram></mxfile>');
        diagramHost.getFileByPath.mockImplementation((path: string) => {
            if (path === 'Notes/Architecture_diagram.drawio.svg') {
                return { path };
            }
            return null;
        });
        (diagramHost as any).readFile = jest.fn(async () => '<svg><text>Draw.io companion</text></svg>');

        const result = await runPreviewDiagramCommandWithHost(host as any, file as any, reporter as any);

        expect(result).toMatchObject({
            kind: 'success',
            artifact: expect.objectContaining({
                target: 'drawio',
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Draw.io companion')
                })
            })
        });
        expect(diagramHost.openPreview).toHaveBeenLastCalledWith(
            expect.objectContaining({
                target: 'drawio',
                previewSvg: expect.objectContaining({
                    content: expect.stringContaining('Draw.io companion')
                })
            }),
            'Notes/Architecture_diagram.drawio',
            true
        );
    });
});
