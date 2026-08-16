import type { DiagramSpec } from '../types';

/** The catalog sample follows the same filename-rooted contract as generated Drawnix maps. */
export const DRAWNIX_KNOWLEDGE_MAP_ARCHITECTURE_EXAMPLE: DiagramSpec = {
    intent: 'drawnixMindmap',
    title: 'architecture.zh-CN',
    summary: 'A native Drawnix tree with cross-branch relationships for an architecture note.',
    nodes: [{
        id: 'architecture-zh-cn',
        label: 'architecture.zh-CN',
        kind: 'document',
        children: [
            {
                id: 'ui-entrypoints',
                label: 'Obsidian UI',
                kind: 'subsystem',
                children: [
                    { id: 'command-palette', label: 'Command palette', kind: 'component' },
                    { id: 'sidebar', label: 'Notemd sidebar', kind: 'component' },
                    { id: 'settings', label: 'Settings tab', kind: 'component' }
                ]
            },
            {
                id: 'plugin-orchestration',
                label: 'Plugin orchestration',
                kind: 'subsystem',
                children: [
                    { id: 'settings-store', label: 'Settings store', kind: 'component' },
                    { id: 'command-dispatch', label: 'Command dispatch', kind: 'component' },
                    { id: 'diagram-operation', label: 'Diagram operation', kind: 'component' }
                ]
            },
            {
                id: 'diagram-platform',
                label: 'Diagram platform',
                kind: 'subsystem',
                children: [
                    { id: 'source-coverage', label: 'Source coverage', kind: 'subsystem' },
                    { id: 'diagram-spec', label: 'DiagramSpec', kind: 'subsystem' },
                    { id: 'drawnix-renderer', label: 'DrawnixRenderer', kind: 'component' }
                ]
            },
            {
                id: 'artifact-output',
                label: 'Artifact output',
                kind: 'subsystem',
                children: [
                    { id: 'drawnix-file', label: '.drawnix source', kind: 'evidence' },
                    { id: 'svg-companion', label: 'SVG companion', kind: 'evidence' },
                    { id: 'markdown-wrapper', label: 'Markdown wrapper', kind: 'evidence' }
                ]
            },
            {
                id: 'cli-boundary',
                label: 'CLI boundary',
                kind: 'subsystem',
                children: [
                    { id: 'obsidian-cli', label: 'Obsidian CLI', kind: 'external' },
                    { id: 'maintainer-bridge', label: 'Maintainer bridge', kind: 'component' }
                ]
            }
        ]
    }],
    edges: [
        { from: 'command-palette', to: 'command-dispatch', label: 'starts' },
        { from: 'sidebar', to: 'command-dispatch', label: 'starts' },
        { from: 'settings', to: 'settings-store', label: 'updates' },
        { from: 'command-dispatch', to: 'diagram-operation', label: 'routes' },
        { from: 'diagram-operation', to: 'source-coverage', label: 'covers source' },
        { from: 'source-coverage', to: 'diagram-spec', label: 'builds' },
        { from: 'diagram-spec', to: 'drawnix-renderer', label: 'renders' },
        { from: 'drawnix-renderer', to: 'drawnix-file', label: 'writes' },
        { from: 'drawnix-renderer', to: 'svg-companion', label: 'previews' },
        { from: 'drawnix-file', to: 'markdown-wrapper', label: 'links' },
        { from: 'obsidian-cli', to: 'maintainer-bridge', label: 'executes' },
        { from: 'maintainer-bridge', to: 'diagram-operation', label: 'invokes' }
    ]
};
