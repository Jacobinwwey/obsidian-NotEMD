import { DiagramNode, DiagramSpec } from '../diagram/types';
import {
    buildDrawnixKnowledgeMapPresentation,
    DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
} from '../diagram/adapters/drawnix/drawnixKnowledgeMapPresentation';
import { renderDrawnixKnowledgeMapPresentationSvg } from '../rendering/renderers/drawnixKnowledgeMapPresentationSvgRenderer';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';

function flattenNodeIds(nodes: readonly DiagramNode[]): string[] {
    return nodes.flatMap(node => [node.id, ...flattenNodeIds(node.children ?? [])]);
}

function createComplexForestSpec(): DiagramSpec {
    return {
        intent: 'drawnixMindmap',
        title: 'Notemd diagram delivery architecture',
        summary: 'Semantic graph, Drawnix board, and presentation artifacts remain independently traceable.',
        nodes: [
            {
                id: 'experience',
                label: 'User experience',
                kind: 'domain',
                children: [
                    { id: 'settings', label: 'Settings delivery selector', kind: 'component' },
                    { id: 'preview', label: 'Preview and export panels', kind: 'component' }
                ]
            },
            {
                id: 'semantic',
                label: 'Semantic graph',
                kind: 'domain',
                children: [
                    {
                        id: 'coverage',
                        label: 'Source coverage forest',
                        kind: 'subsystem',
                        children: [{ id: 'evidence', label: '中文证据与来源引用', kind: 'evidence' }]
                    },
                    { id: 'replay', label: 'Replay metadata', kind: 'component' }
                ]
            },
            {
                id: 'delivery',
                label: 'Drawnix delivery',
                kind: 'domain',
                children: [
                    { id: 'board', label: 'Editable full board', kind: 'component' },
                    { id: 'presentation', label: 'Overview and detail SVG panels', kind: 'component' }
                ]
            }
        ],
        edges: [
            { from: 'settings', to: 'replay', label: 'selects reusable delivery' },
            { from: 'coverage', to: 'board', label: 'projects semantic forest' },
            { from: 'replay', to: 'presentation', label: 'rebuilds without LLM' }
        ]
    };
}

function createContextHeavyForestSpec(): DiagramSpec {
    const sourceChildren = Array.from({ length: 7 }, (_, index) => ({
        id: `source-${index + 1}`,
        label: `Source branch ${index + 1}`
    }));
    const remoteChildren = Array.from({ length: 7 }, (_, index) => ({
        id: `remote-${index + 1}`,
        label: `Remote context ${index + 1}`
    }));
    return {
        intent: 'drawnixMindmap',
        title: 'Context-heavy delivery',
        nodes: [
            { id: 'source-root', label: 'Source root', children: sourceChildren },
            { id: 'remote-root', label: 'Remote root', children: remoteChildren }
        ],
        edges: sourceChildren.map((source, index) => ({
            from: source.id,
            to: remoteChildren[index].id,
            label: `Cross-root relation ${index + 1}`
        }))
    };
}

describe('Drawnix knowledge-map presentation', () => {
    test('preserves every semantic entity across overview, detail slices, and the fidelity ledger', () => {
        const spec = createComplexForestSpec();
        const allNodeIds = new Set(flattenNodeIds(spec.nodes));
        const presentation = buildDrawnixKnowledgeMapPresentation(
            spec,
            DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
        );

        expect(presentation.overview.kind).toBe('overview');
        expect(presentation.overview.nodes.map(node => node.semanticNodeId).sort()).toEqual([
            'delivery',
            'experience',
            'semantic'
        ]);
        expect(presentation.details.map(slice => slice.rootId)).toEqual([
            'experience',
            'semantic',
            'delivery'
        ]);
        expect(presentation.ledger.nodeLocations).toHaveLength(allNodeIds.size);
        expect(presentation.ledger.relationLocations).toHaveLength(spec.edges?.length ?? 0);
        expect(presentation.ledger.nodeLocations.map(location => location.nodeId).sort()).toEqual([...allNodeIds].sort());
        expect(presentation.ledger.nodeLocations.every(location => location.sliceIds.length > 0)).toBe(true);
        expect(presentation.ledger.relationLocations.every(location => location.sliceIds.length > 0)).toBe(true);
    });

    test('uses stable semantic roles and produces a standalone SVG for each static slice', () => {
        const presentation = buildDrawnixKnowledgeMapPresentation(
            createComplexForestSpec(),
            DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
        );
        const svg = renderDrawnixKnowledgeMapPresentationSvg(presentation.details[1]);

        expect(svg).toContain('data-notemd-renderer="notemd-drawnix-knowledge-map-presentation-svg@1.0.0"');
        expect(svg).toContain('data-drawnix-knowledge-map-role="domain"');
        expect(svg).toContain('data-drawnix-knowledge-map-node-id="coverage"');
        expect(svg).toContain('中文证据与来源引用');
    });

    test('centers a fitting overview root grid within its presentation viewport', () => {
        const presentation = buildDrawnixKnowledgeMapPresentation(
            createComplexForestSpec(),
            DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
        );
        const overviewNodes = presentation.overview.nodes;
        const left = Math.min(...overviewNodes.map(node => node.x));
        const right = Math.max(...overviewNodes.map(node => node.x + node.width));
        const overviewContentCenter = (left + right) / 2;

        expect(overviewContentCenter).toBeCloseTo(presentation.overview.width / 2, 0);
    });

    test('packs cross-root context endpoints inside the requested delivery width', () => {
        const contract = {
            ...DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT,
            viewportWidth: 960,
            viewportHeight: 680
        };
        const presentation = buildDrawnixKnowledgeMapPresentation(createContextHeavyForestSpec(), contract);
        const sourceDetails = presentation.details.filter(slice => slice.rootId === 'source-root');

        expect(sourceDetails.flatMap(slice => slice.nodes.filter(node => node.context))).toHaveLength(7);
        expect(sourceDetails.every(slice => (
            slice.nodes.every(node => node.x + node.width <= contract.viewportWidth)
        ))).toBe(true);
    });

    test('keeps detail relation context scoped to the original hierarchy', () => {
        const presentation = buildDrawnixKnowledgeMapPresentation(
            createComplexForestSpec(),
            DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT
        );
        const experienceDetail = presentation.details.find(slice => slice.rootId === 'experience');

        expect(experienceDetail?.relations.map(relation => relation.semanticRelationId)).toEqual([
            'relation-1-settings-to-replay'
        ]);
        expect(experienceDetail?.nodes.filter(node => node.context).map(node => node.semanticNodeId)).toEqual([
            'replay'
        ]);
    });

    test('does not reject a deep or wide semantic forest to satisfy a presentation contract', () => {
        const deepBranch: DiagramNode = { id: 'depth-0', label: 'Depth 0' };
        let current = deepBranch;
        for (let depth = 1; depth <= 24; depth += 1) {
            const child = { id: `depth-${depth}`, label: `Depth ${depth}` };
            current.children = [child];
            current = child;
        }
        const wideRoot: DiagramNode = {
            id: 'wide-root',
            label: 'Wide root',
            children: Array.from({ length: 48 }, (_, index) => ({
                id: `wide-${index + 1}`,
                label: `Independent branch ${index + 1}`
            }))
        };
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Complex forest',
            nodes: [deepBranch, wideRoot],
            edges: [{ from: 'depth-24', to: 'wide-48', label: 'crosses domains' }]
        };

        const presentation = buildDrawnixKnowledgeMapPresentation(spec, {
            ...DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT,
            viewportWidth: 960,
            viewportHeight: 680
        });

        expect(presentation.details.length).toBeGreaterThanOrEqual(2);
        expect(presentation.ledger.nodeLocations).toHaveLength(flattenNodeIds(spec.nodes).length);
        expect(presentation.ledger.relationLocations).toHaveLength(1);
    });

    test('creates bounded continuation slices for a single deep hierarchy', () => {
        const root: DiagramNode = { id: 'depth-0', label: 'Depth 0' };
        let current = root;
        for (let depth = 1; depth <= 24; depth += 1) {
            const child = { id: `depth-${depth}`, label: `Depth ${depth}` };
            current.children = [child];
            current = child;
        }
        const contract = {
            ...DEFAULT_DRAWNIX_KNOWLEDGE_MAP_PRESENTATION_CONTRACT,
            viewportWidth: 960,
            viewportHeight: 680
        };
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Deep single hierarchy',
            nodes: [root]
        };

        const presentation = buildDrawnixKnowledgeMapPresentation(spec, contract);

        expect(presentation.details.length).toBeGreaterThan(1);
        expect(presentation.details.every(slice => (
            slice.width <= contract.viewportWidth && slice.height <= contract.viewportHeight
        ))).toBe(true);
        expect(presentation.ledger.nodeLocations.every(location => location.sliceIds.length > 0)).toBe(true);
        const continuationSlice = presentation.details.find(slice => slice.nodes.some(node => node.summary));
        if (!continuationSlice) {
            throw new Error('Expected a geometry-bounded detail slice to retain a continuation anchor.');
        }
        expect(renderDrawnixKnowledgeMapPresentationSvg(continuationSlice)).toContain('stroke-dasharray="5 3"');
    });

    test('dispatches presentation delivery to a bundle while retaining the full-board companion contract', async () => {
        const spec = createComplexForestSpec();
        const fullBoard = await new DrawnixRenderer().render(spec, {
            drawnixKnowledgeMapDelivery: 'full-board'
        });
        const presentation = await new DrawnixRenderer().render(spec, {
            drawnixKnowledgeMapDelivery: 'presentation'
        });
        const bundle = (presentation as any).drawnixKnowledgeMapPresentation;

        expect((fullBoard as any).drawnixKnowledgeMapPresentation).toBeUndefined();
        expect(presentation.previewSvg?.content).toContain('notemd-drawnix-mindmap-svg@1.0.0');
        expect(bundle).toMatchObject({
            version: 1,
            catalogTypeId: 'drawnix-knowledge-map',
            overview: { fileName: 'overview.svg' },
            semanticSpecHash: expect.stringMatching(/^fnv1a32:[0-9a-f]{8}$/)
        });
        expect(bundle.details.map((detail: { fileName: string }) => detail.fileName)).toEqual([
            'detail-01-experience.svg',
            'detail-02-semantic.svg',
            'detail-03-delivery.svg'
        ]);
        expect(bundle.overview.content).toContain('data-notemd-renderer="notemd-drawnix-knowledge-map-presentation-svg@1.0.0"');
        expect(presentation.previewPanels?.map(panel => panel.id)).toEqual([
            'drawnix-presentation-overview',
            'drawnix-presentation-detail-experience',
            'drawnix-presentation-detail-semantic',
            'drawnix-presentation-detail-delivery'
        ]);
        expect(presentation.previewPanels?.[0].artifact.previewSvg?.content).toContain('User experience');
    });
});
