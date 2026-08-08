import { DiagramNode, DiagramSourceCoverageDiagnostic, DiagramSpec } from '../../types';

const MAX_SOURCE_LABEL_LENGTH = 160;
const DRAWNIX_SOURCE_MAX_DEPTH = 3;

interface SourceNodeFactory {
    create(label: string, prefix: string): DiagramNode;
    usedIds: Set<string>;
}

interface HeadingFrame {
    level: number;
    node: DiagramNode;
}

interface SourceCoverageResult {
    roots: DiagramNode[];
}

function normalizeLabel(value: string): string {
    return value
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/^\s*["'`]+|["'`]+\s*$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function boundedLabel(value: string, fallback: string): string {
    const normalized = normalizeLabel(value) || fallback;
    if (normalized.length <= MAX_SOURCE_LABEL_LENGTH) {
        return normalized;
    }
    return `${normalized.slice(0, MAX_SOURCE_LABEL_LENGTH - 1).trimEnd()}…`;
}

function comparisonLabel(value: string): string {
    return normalizeLabel(value)
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '');
}

function hashLabel(value: string): string {
    let hash = 2166136261;
    for (const character of value) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

function createSourceNodeFactory(reservedIds: Set<string>): SourceNodeFactory {
    const usedIds = new Set(reservedIds);
    return {
        usedIds,
        create(label: string, prefix: string): DiagramNode {
            const normalizedLabel = boundedLabel(label, 'Source detail');
            const baseId = `source-${prefix}-${hashLabel(normalizedLabel)}`;
            let id = baseId;
            let suffix = 2;
            while (usedIds.has(id)) {
                id = `${baseId}-${suffix}`;
                suffix += 1;
            }
            usedIds.add(id);
            return { id, label: normalizedLabel, children: [] };
        }
    };
}

function collectNodeIds(nodes: readonly DiagramNode[], ids: Set<string>): void {
    nodes.forEach(node => {
        if (node.id?.trim()) {
            ids.add(node.id.trim());
        }
        collectNodeIds(node.children ?? [], ids);
    });
}

function cloneNode(node: DiagramNode): DiagramNode {
    return {
        ...node,
        children: (node.children ?? []).map(cloneNode)
    };
}

function appendChildByLabel(parent: DiagramNode, child: DiagramNode): DiagramNode {
    const targetLabel = comparisonLabel(child.label);
    const existing = (parent.children ?? []).find(candidate => comparisonLabel(candidate.label) === targetLabel);
    if (existing) {
        mergeNodeChildren(existing, child.children ?? []);
        return existing;
    }
    parent.children = [...(parent.children ?? []), child];
    return child;
}

function mergeNodeChildren(target: DiagramNode, additions: readonly DiagramNode[]): void {
    additions.forEach(addition => appendChildByLabel(target, cloneNode(addition)));
}

function appendCoverageRoot(nodes: DiagramNode[], root: DiagramNode): DiagramNode {
    const existing = nodes.find(node => comparisonLabel(node.label) === comparisonLabel(root.label));
    if (existing) {
        mergeNodeChildren(existing, root.children ?? []);
        return existing;
    }
    nodes.push(root);
    return root;
}

function basenameWithoutExtension(sourcePath: string): string {
    const basename = sourcePath.trim().split(/[\\/]/u).pop() ?? '';
    return basename.replace(/\.[^.]+$/u, '').trim();
}

function firstDocumentHeading(sourceMarkdown: string): string | undefined {
    for (const line of sourceMarkdown.split(/\r?\n/u)) {
        const heading = parseHeading(line);
        if (heading?.level === 1) {
            return heading.label;
        }
    }
    return undefined;
}

function deriveDocumentLabel(spec: DiagramSpec, sourceMarkdown: string, sourcePath?: string): string {
    return boundedLabel(
        basenameWithoutExtension(sourcePath ?? '')
            || firstDocumentHeading(sourceMarkdown)
            || spec.title
            || 'Generated diagram',
        'Generated diagram'
    );
}

function parseHeading(line: string): { level: number; label: string } | null {
    const match = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) {
        return null;
    }
    return {
        level: match[1].length,
        label: boundedLabel(match[2], 'Untitled section')
    };
}

function coverageHeadingLevel(level: number): number {
    // The synthetic document root consumes one Drawnix level, so H4+ must
    // share the final detail branch instead of creating an unrenderable depth.
    return Math.min(level, 4);
}

function isTableRow(line: string): boolean {
    return /^\s*\|.*\|\s*$/.test(line) && !/^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function detailText(line: string): string | null {
    let value: string | undefined;
    const bullet = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+?)\s*$/);
    if (bullet) {
        value = bullet[1];
    } else if (isTableRow(line)) {
        const cells = line.split('|').slice(1, -1).map(cell => normalizeLabel(cell));
        value = cells.filter(Boolean).join(': ');
    }
    return value ? boundedLabel(value, 'Source detail') : null;
}

function ensureDetailsContainer(
    owner: DiagramNode,
    ownerDepth: number,
    factory: SourceNodeFactory
): DiagramNode {
    const existing = (owner.children ?? []).find(child => comparisonLabel(child.label) === comparisonLabel('Source details'));
    if (existing) {
        return existing;
    }
    const container = factory.create('Source details', 'details');
    if (ownerDepth >= DRAWNIX_SOURCE_MAX_DEPTH - 1) {
        return owner;
    }
    owner.children = [...(owner.children ?? []), container];
    return container;
}

function appendSourceDetail(
    owner: DiagramNode,
    ownerDepth: number,
    value: string,
    factory: SourceNodeFactory
): void {
    const detail = factory.create(value, 'detail');
    if (ownerDepth < DRAWNIX_SOURCE_MAX_DEPTH - 1) {
        appendChildByLabel(ensureDetailsContainer(owner, ownerDepth, factory), detail);
        return;
    }
    appendChildByLabel(owner, detail);
}

function extractMermaidLabels(line: string): Array<{ id: string; label: string }> {
    const labels: Array<{ id: string; label: string }> = [];
    const pattern = /(?:^|[^A-Za-z0-9_-])([A-Za-z][\w-]*)\s*(?:\[\s*([^\]]+)\s*\]|\(\s*([^\)]+)\s*\)|\{\s*([^}]+)\s*\}|>\s*([^\]]+)\s*\])/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(line))) {
        const label = match.slice(2).find(Boolean);
        if (label) {
            labels.push({ id: match[1], label: boundedLabel(label, match[1]) });
        }
    }
    return labels;
}

function extractSubgraphLabel(line: string): string | null {
    const match = line.match(/^\s*subgraph\s+(?:[A-Za-z][\w-]*\s*)?(?:\[\s*([^\]]+)\s*\]|\(([^)]+)\)|\{([^}]+)\})?\s*$/i);
    if (!match) {
        return null;
    }
    return boundedLabel(match.slice(1).find(Boolean) ?? line.replace(/^\s*subgraph\s+/i, ''), 'Mermaid group');
}

function parseMermaidBlock(
    lines: readonly string[],
    ordinal: number,
    factory: SourceNodeFactory
): DiagramNode {
    const directive = lines.find(line => line.trim().length > 0)?.trim() ?? 'diagram';
    const root = factory.create(`Mermaid ${directive.split(/\s+/)[0]} ${ordinal}`, 'mermaid');
    const groupStack: string[] = [];
    const labelsByComparison = new Set<string>();
    const appendVisualLabel = (label: string): void => {
        const normalized = boundedLabel(label, 'Mermaid node');
        const key = comparisonLabel(normalized);
        if (!key || labelsByComparison.has(key)) {
            return;
        }
        labelsByComparison.add(key);
        root.children = [...(root.children ?? []), factory.create(normalized, 'mermaid-node')];
    };

    const activeGroupLabel = (): string | undefined => groupStack.length > 0
        ? groupStack.join(' / ')
        : undefined;

    lines.forEach(line => {
        const subgraphLabel = extractSubgraphLabel(line);
        if (subgraphLabel) {
            appendVisualLabel(subgraphLabel);
            groupStack.push(subgraphLabel);
            return;
        }
        if (/^\s*end\s*$/i.test(line)) {
            groupStack.pop();
            return;
        }

        const participant = line.match(/^\s*participant\s+([^\s]+)(?:\s+as\s+(.+))?\s*$/i);
        if (participant) {
            const label = participant[2] ?? participant[1];
            appendVisualLabel(activeGroupLabel() ? `${activeGroupLabel()}: ${label}` : label);
            return;
        }

        extractMermaidLabels(line).forEach(mermaidNode => {
            appendVisualLabel(activeGroupLabel()
                ? `${activeGroupLabel()}: ${mermaidNode.label}`
                : mermaidNode.label);
        });
    });

    // Preserve the individual Mermaid labels as siblings so the source visual
    // stays within Drawnix's native depth budget after it is attached to a
    // section (document -> section -> Mermaid block -> labels).
    return root;
}

function buildSourceCoverageNodes(sourceMarkdown: string, factory: SourceNodeFactory): SourceCoverageResult {
    const lines = sourceMarkdown.split(/\r?\n/);
    const roots: DiagramNode[] = [];
    const headings: HeadingFrame[] = [];
    let currentRoot: DiagramNode | undefined;
    let inFence = false;
    let fenceMarker = '';
    let mermaidLines: string[] | undefined;
    let mermaidOrdinal = 0;
    let unscopedRoot: DiagramNode | undefined;

    const ensureUnscopedRoot = (): DiagramNode => {
        if (!unscopedRoot) {
            unscopedRoot = factory.create('Additional concepts', 'unscoped');
            appendCoverageRoot(roots, unscopedRoot);
        }
        return unscopedRoot;
    };

    const appendMermaidRoot = (blockLines: string[]): void => {
        if (blockLines.length === 0) {
            return;
        }
        const visualRoot = parseMermaidBlock(blockLines, ++mermaidOrdinal, factory);
        if (currentRoot) {
            appendChildByLabel(currentRoot, visualRoot);
        } else {
            appendChildByLabel(ensureUnscopedRoot(), visualRoot);
        }
    };

    lines.forEach(line => {
        if (mermaidLines) {
            if (new RegExp(`^\\s*${fenceMarker[0]}{${fenceMarker.length},}\\s*$`).test(line)) {
                appendMermaidRoot(mermaidLines);
                mermaidLines = undefined;
                inFence = false;
                fenceMarker = '';
            } else {
                mermaidLines.push(line);
            }
            return;
        }

        if (inFence) {
            if (new RegExp(`^\\s*${fenceMarker[0]}{${fenceMarker.length},}\\s*$`).test(line)) {
                inFence = false;
                fenceMarker = '';
            }
            return;
        }

        const fence = line.match(/^\s*(`{3,}|~{3,})\s*([^\s`]*)?.*$/);
        if (fence) {
            const language = (fence[2] ?? '').toLowerCase();
            if (language === 'mermaid') {
                mermaidLines = [];
            }
            inFence = true;
            fenceMarker = fence[1];
            return;
        }

        const heading = parseHeading(line);
        if (heading) {
            if (heading.level === 1) {
                return;
            }
            const normalizedLevel = coverageHeadingLevel(heading.level);
            if (normalizedLevel === 2 || !currentRoot) {
                const root = factory.create(heading.label, 'section');
                const canonicalRoot = appendCoverageRoot(roots, root);
                currentRoot = canonicalRoot;
                headings.splice(0, headings.length, { level: normalizedLevel, node: canonicalRoot });
                return;
            }

            while (headings.length > 0 && headings[headings.length - 1].level >= normalizedLevel) {
                headings.pop();
            }
            const parent = headings[headings.length - 1];
            if (!parent) {
                return;
            }
            const child = factory.create(heading.label, 'section');
            parent.node.children = [...(parent.node.children ?? []), child];
            headings.push({ level: normalizedLevel, node: child });
            return;
        }

        if (!currentRoot) {
            const value = detailText(line);
            if (value) {
                appendSourceDetail(ensureUnscopedRoot(), 1, value, factory);
            }
            return;
        }
        const value = detailText(line);
        if (!value) {
            return;
        }
        const ownerFrame = headings[headings.length - 1];
        const owner = ownerFrame?.node ?? currentRoot;
        const ownerDepth = Math.max(1, headings.length);
        if (ownerDepth >= DRAWNIX_SOURCE_MAX_DEPTH) {
            const parent = headings[headings.length - 2]?.node ?? currentRoot;
            appendSourceDetail(
                parent,
                DRAWNIX_SOURCE_MAX_DEPTH - 1,
                `${owner.label}: ${value}`,
                factory
            );
        } else {
            appendSourceDetail(owner, ownerDepth, value, factory);
        }
    });

    if (mermaidLines) {
        appendMermaidRoot(mermaidLines);
    }

    return { roots };
}

function collectParentChildPairs(nodes: readonly DiagramNode[], pairs: Set<string>): void {
    nodes.forEach(node => {
        (node.children ?? []).forEach(child => {
            pairs.add(`${node.id}\u0000${child.id}`);
        });
        collectParentChildPairs(node.children ?? [], pairs);
    });
}

function deduplicateAndRemapEdges(
    edges: ReadonlyArray<NonNullable<DiagramSpec['edges']>[number]>,
    idRemap: ReadonlyMap<string, string>,
    roots: readonly DiagramNode[],
    diagnostics: DiagramSourceCoverageDiagnostic[]
): DiagramSpec['edges'] {
    const parentChildPairs = new Set<string>();
    const nodeIds = new Set<string>();
    collectParentChildPairs(roots, parentChildPairs);
    collectNodeIds(roots, nodeIds);
    const seen = new Set<string>();
    const result: NonNullable<DiagramSpec['edges']> = [];

    edges.forEach(edge => {
        const originalFrom = edge.from.trim();
        const originalTo = edge.to.trim();
        const from = idRemap.get(originalFrom) ?? originalFrom;
        const to = idRemap.get(originalTo) ?? originalTo;
        const label = edge.label?.trim() || edge.relation?.trim() || undefined;
        const dropReason = !from || !to
            ? 'an endpoint is empty'
            : !nodeIds.has(from) || !nodeIds.has(to)
                ? 'an endpoint is not present in the covered tree'
                : from === to
                    ? 'the remapped endpoints are identical'
                    : parentChildPairs.has(`${from}\u0000${to}`) || parentChildPairs.has(`${to}\u0000${from}`)
                        ? 'the relationship duplicates hierarchy ownership'
                        : undefined;
        if (dropReason) {
            diagnostics.push({
                kind: 'edge-dropped',
                sourceIds: [originalFrom, originalTo],
                message: `Dropped source relationship ${originalFrom} -> ${originalTo}: ${dropReason}.`
            });
            return;
        }
        const key = `${from}\u0000${to}\u0000${label ?? ''}`;
        if (seen.has(key)) {
            diagnostics.push({
                kind: 'edge-dropped',
                sourceIds: [originalFrom, originalTo],
                message: `Dropped duplicate source relationship ${originalFrom} -> ${originalTo}.`
            });
            return;
        }
        if (from !== originalFrom || to !== originalTo) {
            diagnostics.push({
                kind: 'edge-remapped',
                sourceIds: [originalFrom, originalTo],
                targetId: `${from} -> ${to}`,
                message: `Remapped source relationship ${originalFrom} -> ${originalTo} to ${from} -> ${to}.`
            });
        }
        seen.add(key);
        result.push({ ...edge, from, to, label });
    });
    return result;
}

function mergeModelNodeIntoTarget(
    model: DiagramNode,
    target: DiagramNode,
    targetDepth: number,
    idRemap: Map<string, string>,
    factory: SourceNodeFactory,
    diagnostics: DiagramSourceCoverageDiagnostic[]
): void {
    idRemap.set(model.id, target.id);
    if (model.id !== target.id) {
        diagnostics.push({
            kind: 'node-merged',
            sourceIds: [model.id],
            targetId: target.id,
            message: `Merged model node "${model.id}" into source node "${target.id}" by normalized label.`
        });
    }
    (model.children ?? []).forEach(child => {
        const directMatch = (target.children ?? []).find(candidate => (
            comparisonLabel(candidate.label) === comparisonLabel(child.label)
        ));
        if (directMatch) {
            mergeModelNodeIntoTarget(child, directMatch, targetDepth + 1, idRemap, factory, diagnostics);
            return;
        }

        if (targetDepth >= DRAWNIX_SOURCE_MAX_DEPTH) {
            // Preserve the endpoint identity for an over-deep model edge while
            // keeping the native hierarchy valid; the label remains visible on
            // the nearest legal leaf.
            idRemap.set(child.id, target.id);
            diagnostics.push({
                kind: 'node-compressed',
                sourceIds: [child.id],
                targetId: target.id,
                message: `Remapped over-depth model node "${child.id}" to bounded Drawnix node "${target.id}".`
            });
            return;
        }

        const cloned = cloneNode(child);
        const normalizeChildren = (node: DiagramNode, depth: number): void => {
            if (depth >= DRAWNIX_SOURCE_MAX_DEPTH) {
                const descendants = flattenNodes(node.children ?? []);
                if (descendants.length > 0) {
                    node.label = boundedLabel(
                        `${node.label} (${descendants.map(descendant => descendant.label).join('; ')})`,
                        node.label
                    );
                    descendants.forEach(descendant => idRemap.set(descendant.id, node.id));
                    diagnostics.push({
                        kind: 'node-compressed',
                        sourceIds: [node.id, ...descendants.map(descendant => descendant.id)],
                        targetId: node.id,
                        message: `Compressed descendants of model node "${node.id}" into its bounded Drawnix label.`
                    });
                }
                node.children = [];
                return;
            }
            node.children?.forEach(descendant => normalizeChildren(descendant, depth + 1));
        };
        normalizeChildren(cloned, targetDepth + 1);
        target.children = [...(target.children ?? []), cloned];
        const remapClonedIds = (node: DiagramNode): void => {
            idRemap.set(node.id, node.id);
            node.children?.forEach(remapClonedIds);
        };
        remapClonedIds(cloned);
    });
}

function flattenNodes(nodes: readonly DiagramNode[]): DiagramNode[] {
    return nodes.flatMap(node => [node, ...flattenNodes(node.children ?? [])]);
}

function findDirectChildByLabel(parent: DiagramNode, label: string): DiagramNode | undefined {
    return (parent.children ?? []).find(child => comparisonLabel(child.label) === comparisonLabel(label));
}

function findNodeWithDepth(
    nodes: readonly DiagramNode[],
    label: string,
    depth: number
): { node: DiagramNode; depth: number } | undefined {
    const targetLabel = comparisonLabel(label);
    for (const node of nodes) {
        if (comparisonLabel(node.label) === targetLabel) {
            return { node, depth };
        }
        const nested = findNodeWithDepth(node.children ?? [], label, depth + 1);
        if (nested) {
            return nested;
        }
    }
    return undefined;
}

function ensureAdditionalConcepts(parent: DiagramNode, factory: SourceNodeFactory): DiagramNode {
    const existing = findDirectChildByLabel(parent, 'Additional concepts');
    if (existing) {
        return existing;
    }
    const additional = factory.create('Additional concepts', 'additional');
    parent.children = [...(parent.children ?? []), additional];
    return additional;
}

function isPlaceholderModelNode(node: DiagramNode): boolean {
    return /^untitled(?:\s+\d+(?:-\d+)*)?$/iu.test(normalizeLabel(node.label));
}

function cloneModelForest(nodes: readonly DiagramNode[]): DiagramNode[] {
    return nodes.flatMap(node => {
        const children = cloneModelForest(node.children ?? []);
        if (isPlaceholderModelNode(node)) {
            // Placeholder containers are transparent so meaningful descendants
            // remain visible without retaining an artificial branch label.
            return children;
        }
        return [{ ...node, children }];
    });
}

function appendUnmatchedModelRoot(
    parent: DiagramNode,
    model: DiagramNode,
    factory: SourceNodeFactory,
    idRemap: Map<string, string>,
    parentDepth: number,
    diagnostics: DiagramSourceCoverageDiagnostic[]
): void {
    const existing = findDirectChildByLabel(parent, model.label);
    if (existing) {
        mergeModelNodeIntoTarget(model, existing, parentDepth + 1, idRemap, factory, diagnostics);
        return;
    }

    const cloned = cloneNode(model);
    const normalizeChildren = (node: DiagramNode, depth: number): void => {
        if (depth >= DRAWNIX_SOURCE_MAX_DEPTH) {
            const descendants = flattenNodes(node.children ?? []);
            if (descendants.length > 0) {
                node.label = boundedLabel(
                    `${node.label} (${descendants.map(descendant => descendant.label).join('; ')})`,
                    node.label
                );
                descendants.forEach(descendant => idRemap.set(descendant.id, node.id));
                diagnostics.push({
                    kind: 'node-compressed',
                    sourceIds: [node.id, ...descendants.map(descendant => descendant.id)],
                    targetId: node.id,
                    message: `Compressed descendants of unmatched model node "${node.id}" into its bounded Drawnix label.`
                });
            }
            node.children = [];
            return;
        }
        node.children?.forEach(descendant => normalizeChildren(descendant, depth + 1));
    };
    normalizeChildren(cloned, parentDepth + 1);
    parent.children = [...(parent.children ?? []), cloned];
    const remapClonedIds = (node: DiagramNode): void => {
        idRemap.set(node.id, node.id);
        node.children?.forEach(remapClonedIds);
    };
    remapClonedIds(cloned);
}

/**
 * Adds deterministic source-derived taxonomy to a model-generated Drawnix map.
 * The exact source visuals remain companions; this layer makes the native tree
 * useful even when the LLM returns only a small summary of a long note.
 */
export function mergeDrawnixSourceCoverage(
    spec: DiagramSpec,
    sourceMarkdown: string,
    sourcePath?: string
): DiagramSpec {
    if (spec.intent !== 'drawnixMindmap' || !sourceMarkdown.trim()) {
        return spec;
    }

    const reservedIds = new Set<string>();
    collectNodeIds(spec.nodes ?? [], reservedIds);
    const factory = createSourceNodeFactory(reservedIds);
    const coverage = buildSourceCoverageNodes(sourceMarkdown, factory);
    const documentRoot = factory.create(deriveDocumentLabel(spec, sourceMarkdown, sourcePath), 'document');
    coverage.roots.forEach(root => appendChildByLabel(documentRoot, root));

    const idRemap = new Map<string, string>();
    const diagnostics: DiagramSourceCoverageDiagnostic[] = [];
    const modelRoots = cloneModelForest(spec.nodes ?? []);
    modelRoots.forEach(modelRoot => {
        const documentMatch = comparisonLabel(modelRoot.label) === comparisonLabel(documentRoot.label)
            ? { node: documentRoot, depth: 0 }
            : findNodeWithDepth(documentRoot.children ?? [], modelRoot.label, 1);
        if (documentMatch) {
            mergeModelNodeIntoTarget(modelRoot, documentMatch.node, documentMatch.depth, idRemap, factory, diagnostics);
            return;
        }
        const additional = ensureAdditionalConcepts(documentRoot, factory);
        appendUnmatchedModelRoot(
            additional,
            modelRoot,
            factory,
            idRemap,
            1,
            diagnostics
        );
    });

    const mergedNodes = [documentRoot];
    return {
        ...spec,
        nodes: mergedNodes,
        edges: deduplicateAndRemapEdges(spec.edges ?? [], idRemap, mergedNodes, diagnostics),
        ...(diagnostics.length > 0 ? { sourceCoverageDiagnostics: diagnostics } : {})
    };
}
