import { DiagramSpec } from '../diagram/types';
import { buildDrawnixMindMapProjection } from '../diagram/adapters/drawnix/drawnixMindMapProjection';
import {
    findDrawnixDirectReservedLaneRoute,
    routeDrawnixCrossRootRelation,
    routeDrawnixRelationThroughReservedLane
} from '../diagram/adapters/drawnix/drawnixCrossRootRouter';
import { DrawnixRenderer } from '../rendering/renderers/drawnixRenderer';
import { DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE } from './fixtures/drawnixArchitectureDocumentTreeFixture';

function intersectsInterior(
    start: [number, number],
    end: [number, number],
    rectangle: { x: number; y: number; width: number; height: number }
): boolean {
    const left = rectangle.x;
    const right = rectangle.x + rectangle.width;
    const top = rectangle.y;
    const bottom = rectangle.y + rectangle.height;
    if (start[0] === end[0]) {
        return start[0] > left && start[0] < right
            && Math.max(Math.min(start[1], end[1]), top) < Math.min(Math.max(start[1], end[1]), bottom);
    }
    if (start[1] === end[1]) {
        return start[1] > top && start[1] < bottom
            && Math.max(Math.min(start[0], end[0]), left) < Math.min(Math.max(start[0], end[0]), right);
    }
    return false;
}

function assertProjectionRouteGeometry(
    projection: ReturnType<typeof buildDrawnixMindMapProjection>
): void {
    const header = {
        x: 0,
        y: 0,
        width: projection.width,
        height: projection.header.safeHeight
    };

    projection.crossRelations.forEach(relation => {
        relation.points.forEach(([x, y]) => {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(projection.width);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(projection.height);
        });
        relation.points.slice(1).forEach((point, index) => {
            expect(intersectsInterior(relation.points[index], point, header)).toBe(false);
            projection.nodes.forEach(node => {
                expect(intersectsInterior(relation.points[index], point, node)).toBe(false);
            });
        });
    });
}

function createLargeFilenameRootedRoutingSpec(): DiagramSpec {
    const modules = (systemId: string, sourceModuleId?: string) => Array.from(
        { length: 19 },
        (_, moduleOffset) => {
            const moduleNumber = moduleOffset + 1;
            const id = sourceModuleId && moduleNumber === 1
                ? sourceModuleId
                : `${systemId}-module-${moduleNumber}`;
            return {
                id,
                label: `Module ${systemId}.${moduleNumber}`,
                children: Array.from({ length: 9 }, (_, leafOffset) => ({
                    id: `${id}-leaf-${leafOffset + 1}`,
                    label: `Capability ${systemId}.${moduleNumber}.${leafOffset + 1}`
                }))
            };
        }
    );
    const sourceSystem = {
        id: 'sys-llm',
        label: 'LLM runtime',
        children: modules('sys-llm', 'mod-llmproviders')
    };
    const targetSystem = {
        id: 'sys-prov',
        label: 'Provider contracts',
        children: modules('sys-prov')
    };

    return {
        intent: 'drawnixMindmap',
        title: 'architecture.zh-CN',
        nodes: [{
            id: 'architecture-zh-cn',
            label: 'architecture.zh-CN',
            children: [sourceSystem, targetSystem]
        }],
        edges: [
            { from: 'mod-llmproviders-leaf-1', to: 'sys-prov-module-1-leaf-9', label: 'dependency 1' },
            { from: 'sys-llm-module-2-leaf-1', to: 'sys-prov-module-2-leaf-9', label: 'dependency 2' },
            { from: 'sys-llm-module-3-leaf-1', to: 'sys-prov-module-3-leaf-9', label: 'dependency 3' },
            { from: 'sys-llm-module-4-leaf-1', to: 'sys-prov-module-4-leaf-9', label: 'dependency 4' },
            { from: 'sys-llm-module-5-leaf-1', to: 'sys-prov-module-5-leaf-9', label: 'dependency 5' },
            { from: 'mod-llmproviders', to: 'sys-prov', label: 'validates provider contract' }
        ]
    };
}

function createLargeSameSideParentRelationSpec(): DiagramSpec {
    const systems = Array.from({ length: 4 }, (_, systemOffset) => {
        const systemNumber = systemOffset + 1;
        const systemId = `system-${systemNumber}`;
        return {
            id: systemId,
            label: `System ${systemNumber}`,
            children: Array.from({ length: 20 }, (_, moduleOffset) => {
                const moduleNumber = moduleOffset + 1;
                const moduleId = `${systemId}-module-${moduleNumber}`;
                return {
                    id: moduleId,
                    label: `Module ${systemNumber}.${moduleNumber}`,
                    children: Array.from({ length: 3 }, (_, leafOffset) => ({
                        id: `${moduleId}-leaf-${leafOffset + 1}`,
                        label: `Capability ${systemNumber}.${moduleNumber}.${leafOffset + 1}`
                    }))
                };
            })
        };
    });
    systems[0].children.push(...Array.from({ length: 6 }, (_, extraOffset) => ({
        id: `system-1-extra-${extraOffset + 1}`,
        label: `Additional capability ${extraOffset + 1}`,
        children: []
    })));

    return {
        intent: 'drawnixMindmap',
        title: 'architecture.zh-CN',
        nodes: [{
            id: 'architecture-zh-cn',
            label: 'architecture.zh-CN',
            children: systems
        }],
        edges: [{
            from: 'system-1-module-1',
            to: 'system-2-module-1',
            label: 'coordinates the execution path'
        }]
    };
}

function createDenseSameSideRelationSpec(): DiagramSpec {
    const spec = createLargeFilenameRootedRoutingSpec();
    const moduleNumbers = Array.from({ length: 18 }, (_, index) => index + 2);
    const edges = Array.from({ length: 35 }, (_, index) => {
        const sourceModule = moduleNumbers[index % moduleNumbers.length];
        const targetModule = moduleNumbers[(index * 7 + 5) % moduleNumbers.length];
        return {
            from: `sys-llm-module-${sourceModule}-leaf-${(index % 9) + 1}`,
            to: `sys-llm-module-${targetModule}-leaf-${((index + 4) % 9) + 1}`,
            label: `same-side dependency ${index + 1}`
        };
    });

    return {
        ...spec,
        edges
    };
}

describe('Drawnix relation routing', () => {
    test('finds a direct reserved-lane route before grid fallback is considered', () => {
        const source = {
            id: 'source',
            rootId: 'root',
            label: 'Source',
            role: 'concept',
            depth: 1,
            branchIndex: 0,
            x: 200,
            y: 300,
            width: 96,
            height: 48,
            textLines: ['Source']
        };
        const target = {
            id: 'target',
            rootId: 'root',
            label: 'Target',
            role: 'concept',
            depth: 1,
            branchIndex: 1,
            x: 920,
            y: 300,
            width: 96,
            height: 48,
            textLines: ['Target']
        };

        const route = findDrawnixDirectReservedLaneRoute({
            source,
            target,
            nodes: [source, target],
            lane: {
                relationId: 'source-target',
                leftTrackX: 420,
                rightTrackX: 860,
                y: 700,
                labelCenterX: 640
            },
            canvasWidth: 1280,
            canvasHeight: 900
        });

        expect(route).toEqual(expect.objectContaining({
            strategy: 'reserved-lane',
            nativeTextPosition: expect.any(Number)
        }));
        expect(route?.points).toEqual(expect.arrayContaining([
            [420, 700],
            [860, 700]
        ]));
    });

    test('routes around unrelated roots instead of crossing their rectangles', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Forest',
            nodes: [
                { id: 'root-a', label: 'Root A', children: [{ id: 'a-child', label: 'A child' }] },
                { id: 'root-b', label: 'Root B', children: [{ id: 'b-child', label: 'B child' }] },
                { id: 'root-c', label: 'Root C', children: [{ id: 'c-child', label: 'C child' }] }
            ],
            edges: [{ from: 'a-child', to: 'c-child', label: 'crosses forest' }]
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const relation = projection.crossRelations[0];
        const middleRegion = projection.rootRegions.find(region => region.rootId === 'root-b');

        expect(middleRegion).toBeDefined();
        expect(relation.sourceRootId).toBe('root-a');
        expect(relation.targetRootId).toBe('root-c');
        expect(relation.routeStrategy).toBeDefined();
        relation.points.slice(1).forEach((point, index) => {
            expect(intersectsInterior(relation.points[index], point, middleRegion!)).toBe(false);
        });
    });

    test('keeps a subpixel grid route inside the interior corridor before using the perimeter', () => {
        const route = routeDrawnixCrossRootRelation({
            source: {
                id: 'source',
                rootId: 'source-root',
                label: 'Source',
                role: 'concept',
                depth: 0,
                branchIndex: -1,
                x: 100.123,
                y: 300.456,
                width: 96.789,
                height: 54.321,
                textLines: ['Source']
            },
            target: {
                id: 'target',
                rootId: 'target-root',
                label: 'Target',
                role: 'concept',
                depth: 0,
                branchIndex: -1,
                x: 1000.123,
                y: 300.456,
                width: 96.789,
                height: 54.321,
                textLines: ['Target']
            },
            relationIndex: 0,
            regions: [{
                rootId: 'middle-root',
                rowIndex: 0,
                columnIndex: 0,
                x: 400,
                y: 180,
                width: 300,
                height: 300
            }],
            canvasWidth: 1280,
            canvasHeight: 900
        });

        expect(route.strategy).toBe('grid');
    });

    test('uses the same routed points in native JSON and SVG output', async () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Shared route',
            nodes: [
                { id: 'a', label: 'A', children: [{ id: 'a-child', label: 'A child' }] },
                { id: 'b', label: 'B' },
                { id: 'c', label: 'C', children: [{ id: 'c-child', label: 'C child' }] }
            ],
            edges: [{ from: 'a-child', to: 'c-child' }]
        };
        const projection = buildDrawnixMindMapProjection(spec);
        const artifact = await new DrawnixRenderer().render(spec);
        const data = JSON.parse(artifact.content);
        const nativeArrow = data.elements.find((element: { type: string }) => element.type === 'arrow-line');

        expect(nativeArrow.points).toEqual(projection.crossRelations[0].points);
        expect(artifact.previewSvg?.content).toContain(`data-drawnix-mindmap-route-strategy="${projection.crossRelations[0].routeStrategy}"`);
        expect(artifact.previewSvg?.content).toContain(`data-drawnix-mindmap-source-root="a"`);
    });

    test('keeps parallel relations deterministic and separated', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Parallel',
            nodes: [
                { id: 'left', label: 'Left', children: [{ id: 'left-a', label: 'Left A' }, { id: 'left-b', label: 'Left B' }] },
                { id: 'right', label: 'Right', children: [{ id: 'right-a', label: 'Right A' }, { id: 'right-b', label: 'Right B' }] }
            ],
            edges: [
                { from: 'left-a', to: 'right-a' },
                { from: 'left-b', to: 'right-b' }
            ]
        };

        const first = buildDrawnixMindMapProjection(spec);
        const second = buildDrawnixMindMapProjection(spec);

        expect(second.crossRelations).toEqual(first.crossRelations);
        expect(first.crossRelations[0].points).not.toEqual(first.crossRelations[1].points);
    });

    test('keeps duplicate endpoint relations on separate lanes', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Duplicate endpoints',
            nodes: [
                { id: 'left', label: 'Left', children: [{ id: 'left-child', label: 'Left child' }] },
                { id: 'right', label: 'Right', children: [{ id: 'right-child', label: 'Right child' }] }
            ],
            edges: [
                { from: 'left-child', to: 'right-child', label: 'first relation' },
                { from: 'left-child', to: 'right-child', label: 'second relation' }
            ]
        };

        const projection = buildDrawnixMindMapProjection(spec);

        expect(projection.crossRelations[0].points).not.toEqual(projection.crossRelations[1].points);
    });

    test('keeps same-root routes outside the target node before the arrow terminates', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Target clearance',
            nodes: [{
                id: 'root',
                label: 'Root',
                children: [
                    { id: 'source', label: 'Source' },
                    { id: 'target', label: 'Target' }
                ]
            }],
            edges: [{ from: 'source', to: 'target', label: 'feeds target' }]
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const relation = projection.crossRelations[0];
        const target = projection.nodes.find(node => node.id === 'target');

        expect(target).toBeDefined();
        relation.points.slice(1).forEach((point, index) => {
            expect(intersectsInterior(relation.points[index], point, target!)).toBe(false);
        });
    });

    test('routes dense same-root branches through their allocated relation lane without entering nodes', () => {
        const children = Array.from({ length: 30 }, (_, branchIndex) => ({
            id: `branch-${branchIndex}`,
            label: `Branch ${branchIndex}`,
            children: Array.from({ length: 5 }, (_, childIndex) => ({
                id: `branch-${branchIndex}-child-${childIndex}`,
                label: `Child ${branchIndex}-${childIndex}`,
                children: [{
                    id: `branch-${branchIndex}-leaf-${childIndex}`,
                    label: `Leaf ${branchIndex}-${childIndex}`
                }]
            }))
        }));
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Dense same-root routing',
            nodes: [{ id: 'root', label: 'Root', children }],
            edges: [{
                from: 'branch-0-child-0',
                to: 'branch-1-child-0',
                label: 'dense branch relation'
            }]
        };

        const projection = buildDrawnixMindMapProjection(spec);
        const relation = projection.crossRelations[0];
        const source = projection.nodes.find(node => node.id === relation.sourceId);
        const target = projection.nodes.find(node => node.id === relation.targetId);

        expect(source).toBeDefined();
        expect(target).toBeDefined();
        expect(Math.max(...relation.points.map(([, y]) => y))).toBeGreaterThan(
            Math.max(...projection.nodes.map(node => node.y + node.height))
        );
        relation.points.slice(1).forEach((point, index) => {
            projection.nodes.forEach(node => {
                expect(intersectsInterior(relation.points[index], point, node)).toBe(false);
            });
        });
    });

    test('routes every relation in a multi-branch architecture fixture with local, obstacle-free geometry', () => {
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Notemd architecture',
            summary: 'Architecture modules and operational dependencies.',
            nodes: [{
                id: 'notemd',
                label: 'Notemd system architecture',
                children: [
                    {
                        id: 'interface',
                        label: 'Obsidian interface',
                        children: [
                            { id: 'command-palette', label: 'Command palette' },
                            { id: 'sidebar', label: 'Sidebar' },
                            { id: 'settings', label: 'Settings' }
                        ]
                    },
                    {
                        id: 'plugin',
                        label: 'Plugin orchestration',
                        children: [
                            { id: 'main', label: 'Command registration' },
                            { id: 'operations', label: 'Host adapters' },
                            { id: 'batch', label: 'Batch processing' }
                        ]
                    },
                    {
                        id: 'llm',
                        label: 'LLM pipeline',
                        children: [
                            { id: 'providers', label: 'Provider registry' },
                            { id: 'token', label: 'Token and cache' },
                            { id: 'transport', label: 'Transport runtimes' }
                        ]
                    },
                    {
                        id: 'diagram',
                        label: 'Diagram platform',
                        children: [
                            { id: 'spec', label: 'DiagramSpec' },
                            { id: 'renderers', label: 'RendererRegistry' },
                            { id: 'drawnix', label: 'Drawnix knowledge map' }
                        ]
                    },
                    {
                        id: 'output',
                        label: 'Output and preview',
                        children: [
                            { id: 'vault', label: 'Vault files' },
                            { id: 'preview', label: 'Preview modal' },
                            { id: 'export', label: 'Artifact export' }
                        ]
                    }
                ]
            }],
            edges: [
                { from: 'command-palette', to: 'main', label: 'triggers' },
                { from: 'operations', to: 'providers', label: 'invokes' },
                { from: 'transport', to: 'spec', label: 'generates' },
                { from: 'renderers', to: 'export', label: 'exports' },
                { from: 'sidebar', to: 'operations', label: 'opens' },
                { from: 'settings', to: 'token', label: 'configures' },
                { from: 'providers', to: 'renderers', label: 'supplies' },
                { from: 'vault', to: 'command-palette', label: 'surfaces' }
            ]
        };

        const expectedRelationCount = spec.edges?.length ?? 0;
        const projection = buildDrawnixMindMapProjection(spec);
        const repeatedProjection = buildDrawnixMindMapProjection(spec);
        const sameSideRelation = projection.crossRelations.find(
            relation => relation.id === 'cross-1-command-palette-to-main'
        );

        expect(projection.crossRelations).toHaveLength(expectedRelationCount);
        expect(repeatedProjection.crossRelations).toEqual(projection.crossRelations);
        expect(projection.nodes).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'notemd' })
        ]));
        expect(sameSideRelation).toMatchObject({
            sourceId: 'command-palette',
            targetId: 'main',
            label: 'triggers'
        });
        expect(sameSideRelation?.labelLayout).toBeDefined();
        assertProjectionRouteGeometry(projection);
    });

    test('routes the real architecture-shaped multi-root relation set without rejecting a dense lane', () => {
        const root = (id: string, label: string, children: Array<[string, string]>): DiagramSpec['nodes'][number] => ({
            id,
            label,
            children: children.map(([childId, childLabel]) => ({ id: childId, label: childLabel }))
        });
        const spec: DiagramSpec = {
            intent: 'drawnixMindmap',
            title: 'Notemd 系统架构总览',
            nodes: [
                root('ui-entrypoints', 'Obsidian 用户界面', [
                    ['command-panel', '命令面板'],
                    ['notemd-sidebar', 'Notemd 工作台'],
                    ['settings-tab', '设置标签页']
                ]),
                root('plugin-orchestration', 'NotemdPlugin 编排', [
                    ['settings-store', '设置加载与保存'],
                    ['command-dispatch', '命令分发'],
                    ['batch-operations', '批量处理'],
                    ['operation-host-adapters', 'Host adapter 编排']
                ]),
                root('llm-pipeline', 'LLM 调用管道', [
                    ['provider-registry', '提供商注册'],
                    ['token-policy', '令牌解析'],
                    ['response-cache', '响应缓存'],
                    ['transport-runtime', '传输运行时']
                ]),
                root('diagram-platform', '图表渲染平台', [
                    ['diagram-plan', 'DiagramPlan'],
                    ['spec-generation', 'DiagramSpec 提示与解析'],
                    ['renderer-registry', 'RendererRegistry'],
                    ['preview-host', 'IframeRenderHost']
                ]),
                root('artifact-delivery', 'Artifact 交付', [
                    ['vault-artifacts', 'Vault 可编辑工件'],
                    ['preview-modal', 'DiagramPreviewModal'],
                    ['multi-format-export', 'SVG / PNG / PDF 导出'],
                    ['artifact-preview', 'Artifact preview']
                ]),
                root('cli-boundary', 'CLI 与 operation 边界', [
                    ['official-cli', '官方 Obsidian CLI'],
                    ['maintainer-bridge', 'Maintainer bridge'],
                    ['operation-core', '宿主无关 operation core'],
                    ['typed-contracts', 'Capability 与调用契约']
                ])
            ],
            edges: [
                { from: 'command-panel', to: 'command-dispatch', label: '触发' },
                { from: 'notemd-sidebar', to: 'command-dispatch', label: '触发' },
                { from: 'command-dispatch', to: 'provider-registry', label: '选择模型' },
                { from: 'response-cache', to: 'transport-runtime', label: '未命中后请求' },
                { from: 'transport-runtime', to: 'spec-generation', label: '结构化响应' },
                { from: 'spec-generation', to: 'renderer-registry', label: 'DiagramSpec' },
                { from: 'renderer-registry', to: 'vault-artifacts', label: '持久化' },
                { from: 'renderer-registry', to: 'preview-host', label: '渲染会话' },
                { from: 'artifact-preview', to: 'preview-modal', label: 'opens preview' },
                { from: 'official-cli', to: 'operation-core', label: '命令触发' },
                { from: 'operation-core', to: 'command-dispatch', label: '宿主绑定' }
            ]
        };

        const projection = buildDrawnixMindMapProjection(spec);

        expect(projection.crossRelations).toHaveLength(spec.edges?.length ?? 0);
        assertProjectionRouteGeometry(projection);
    });

    test('routes the filename-rooted architecture fixture without dropping relationships', () => {
        const projection = buildDrawnixMindMapProjection(DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE);
        const crossBranchRelation = projection.crossRelations.find(
            relation => relation.id === 'cross-2-notemd-sidebar-to-command-dispatch'
        );

        expect(projection.roots).toHaveLength(1);
        expect(projection.crossRelations).toHaveLength(DRAWNIX_ARCHITECTURE_DOCUMENT_TREE_FIXTURE.edges?.length ?? 0);
        expect(crossBranchRelation?.points.length).toBeGreaterThanOrEqual(2);
        assertProjectionRouteGeometry(projection);
    });

    test('routes a 383-node filename-rooted tree through exterior relation lanes', () => {
        const spec = createLargeFilenameRootedRoutingSpec();
        const projection = buildDrawnixMindMapProjection(spec);
        const replay = buildDrawnixMindMapProjection(spec);
        const failedRelation = projection.crossRelations.find(
            relation => relation.id === 'cross-6-mod-llmproviders-to-sys-prov'
        );

        expect(projection.nodes).toHaveLength(383);
        expect(failedRelation).toBeDefined();
        expect(replay.crossRelations).toEqual(projection.crossRelations);
        assertProjectionRouteGeometry(projection);
    });

    test('routes a 331-node filename-rooted relation between dense same-side parents', () => {
        const spec = createLargeSameSideParentRelationSpec();
        const projection = buildDrawnixMindMapProjection(spec);

        expect(projection.nodes).toHaveLength(331);
        expect(projection.crossRelations).toHaveLength(1);
        expect(projection.crossRelations[0].routeStrategy).toBe('reserved-lane');
        assertProjectionRouteGeometry(projection);
    });

    test('routes every same-side relation in a dense filename-rooted tree without a relation quota', () => {
        const spec = createDenseSameSideRelationSpec();
        const projection = buildDrawnixMindMapProjection(spec);

        expect(projection.nodes).toHaveLength(383);
        expect(projection.crossRelations).toHaveLength(35);
        assertProjectionRouteGeometry(projection);
    });

    test('uses vertical node ports when horizontal ingress cannot reach a reserved lane', () => {
        const source = {
            id: 'source',
            rootId: 'root',
            label: 'source',
            role: 'concept' as const,
            depth: 1,
            branchIndex: 0,
            x: 500,
            y: 280,
            width: 72,
            height: 48,
            textLines: ['source']
        };
        const target = {
            id: 'target',
            rootId: 'root',
            label: 'target',
            role: 'concept' as const,
            depth: 1,
            branchIndex: 0,
            x: 620,
            y: 520,
            width: 72,
            height: 48,
            textLines: ['target']
        };
        const nodes = [
            source,
            target,
            { id: 'b0', rootId: 'root', label: 'b0', role: 'concept' as const, depth: 1, branchIndex: 0, x: 400, y: 360, width: 72, height: 48, textLines: ['b0'] },
            { id: 'b6', rootId: 'root', label: 'b6', role: 'concept' as const, depth: 1, branchIndex: 0, x: 80, y: 600, width: 72, height: 48, textLines: ['b6'] },
            { id: 'b16', rootId: 'root', label: 'b16', role: 'concept' as const, depth: 1, branchIndex: 0, x: 320, y: 280, width: 72, height: 48, textLines: ['b16'] },
            { id: 'b21', rootId: 'root', label: 'b21', role: 'concept' as const, depth: 1, branchIndex: 0, x: 200, y: 680, width: 72, height: 48, textLines: ['b21'] },
            { id: 'b24', rootId: 'root', label: 'b24', role: 'concept' as const, depth: 1, branchIndex: 0, x: 560, y: 640, width: 72, height: 48, textLines: ['b24'] },
            { id: 'b33', rootId: 'root', label: 'b33', role: 'concept' as const, depth: 1, branchIndex: 0, x: 440, y: 760, width: 72, height: 48, textLines: ['b33'] },
            { id: 'b43', rootId: 'root', label: 'b43', role: 'concept' as const, depth: 1, branchIndex: 0, x: 600, y: 760, width: 72, height: 48, textLines: ['b43'] }
        ];
        const route = routeDrawnixRelationThroughReservedLane({
            source,
            target,
            nodes,
            lane: {
                relationId: 'probe',
                leftTrackX: 120,
                rightTrackX: 260,
                y: 820,
                labelCenterX: 190,
                labelBounds: { x: 130, y: 804, width: 120, height: 32 }
            },
            canvasWidth: 1200,
            canvasHeight: 900
        });

        expect(route.points[0]).toEqual([536, 280]);
        expect(route.points.some(([, y]) => y === 820)).toBe(true);
        expect(route.nativeTextPosition).toBeGreaterThan(0);
        expect(route.nativeTextPosition).toBeLessThan(1);
    });

    test('fails closed instead of returning a direct route when no obstacle-free route exists', () => {
        expect(() => routeDrawnixCrossRootRelation({
            source: {
                id: 'source',
                rootId: 'source-root',
                label: 'Source',
                role: 'concept',
                depth: 0,
                branchIndex: -1,
                x: 100,
                y: 100,
                width: 80,
                height: 60,
                textLines: ['Source']
            },
            target: {
                id: 'target',
                rootId: 'target-root',
                label: 'Target',
                role: 'concept',
                depth: 0,
                branchIndex: -1,
                x: 1000,
                y: 100,
                width: 80,
                height: 60,
                textLines: ['Target']
            },
            relationIndex: 0,
            regions: [{
                rootId: 'unrelated-root',
                rowIndex: 0,
                columnIndex: 0,
                x: 0,
                y: 0,
                width: 1200,
                height: 300
            }],
            canvasWidth: 1200,
            canvasHeight: 400
        })).toThrow(/must fall back to a non-Drawnix target/i);
    });

    test('fails closed instead of emitting a clipped off-canvas perimeter route', () => {
        const source = {
            id: 'source',
            rootId: 'source-root',
            label: 'Source',
            role: 'concept',
            depth: 0,
            branchIndex: -1,
            x: 100,
            y: 200,
            width: 80,
            height: 60,
            textLines: ['Source']
        };
        const target = {
            id: 'target',
            rootId: 'target-root',
            label: 'Target',
            role: 'concept',
            depth: 0,
            branchIndex: -1,
            x: 900,
            y: 200,
            width: 80,
            height: 60,
            textLines: ['Target']
        };

        expect(() => routeDrawnixCrossRootRelation({
            source,
            target,
            nodes: [source, target],
            additionalObstacles: [{ x: 200, y: 0, width: 680, height: 600 }],
            relationIndex: 0,
            regions: [],
            canvasWidth: 1080,
            canvasHeight: 600
        })).toThrow(/must fall back to a non-Drawnix target/i);
    });
});
