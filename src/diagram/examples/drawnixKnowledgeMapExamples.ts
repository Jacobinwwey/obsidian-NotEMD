import type { DiagramSpec } from '../types';

/** The first-class Drawnix fixture exercises a multi-root architecture map. */
export const DRAWNIX_KNOWLEDGE_MAP_ARCHITECTURE_EXAMPLE: DiagramSpec = {
    intent: 'drawnixMindmap',
    title: 'Notemd Diagram Delivery',
    summary: 'Type selection, semantic generation, and owned artifact delivery.',
    nodes: [
        {
            id: 'interaction',
            label: 'Interaction',
            kind: 'root',
            children: [
                { id: 'settings', label: 'Settings', kind: 'component' },
                { id: 'cli', label: 'Maintainer CLI', kind: 'external' }
            ]
        },
        {
            id: 'generation',
            label: 'Semantic generation',
            kind: 'root',
            children: [
                { id: 'catalog', label: 'Diagram type catalog', kind: 'domain' },
                { id: 'spec', label: 'DiagramSpec', kind: 'subsystem' },
                { id: 'prompt', label: 'Drawnix prompt', kind: 'component' }
            ]
        },
        {
            id: 'delivery',
            label: 'Delivery',
            kind: 'root',
            children: [
                { id: 'board', label: 'Editable full board', kind: 'component' },
                { id: 'presentation', label: 'Presentation bundle', kind: 'component' },
                { id: 'manifest', label: 'Replay manifest', kind: 'evidence' }
            ]
        }
    ],
    edges: [
        { from: 'settings', to: 'catalog', label: 'selects' },
        { from: 'cli', to: 'spec', label: 'supplies' },
        { from: 'catalog', to: 'prompt', label: 'selects' },
        { from: 'spec', to: 'board', label: 'projects to' },
        { from: 'spec', to: 'presentation', label: 'plans' },
        { from: 'presentation', to: 'manifest', label: 'records' }
    ]
};
