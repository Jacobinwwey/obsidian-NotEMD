import { DiagramNode, DiagramSourceCoverageDiagnostic, DiagramSpec } from '../../types';

const MAX_SOURCE_LABEL_LENGTH = 160;

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

function mapClonedSubtreeIds(node: DiagramNode, idRemap: Map<string, string>): void {
    idRemap.set(node.id, node.id);
    node.children?.forEach(child => mapClonedSubtreeIds(child, idRemap));
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
    factory: SourceNodeFactory
): DiagramNode {
    const existing = (owner.children ?? []).find(child => comparisonLabel(child.label) === comparisonLabel('Source details'));
    if (existing) {
        return existing;
    }
    const container = factory.create('Source details', 'details');
    owner.children = [...(owner.children ?? []), container];
    return container;
}

function appendSourceDetail(
    owner: DiagramNode,
    value: string,
    factory: SourceNodeFactory
): void {
    const detail = factory.create(value, 'detail');
    appendChildByLabel(ensureDetailsContainer(owner, factory), detail);
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

    // Preserve Mermaid labels as siblings so a source visual remains readable
    // when attached to a section (document -> section -> Mermaid block -> labels).
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
            const normalizedLevel = heading.level;
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
                appendSourceDetail(ensureUnscopedRoot(), value, factory);
            }
            return;
        }
        const value = detailText(line);
        if (!value) {
            return;
        }
        const ownerFrame = headings[headings.length - 1];
        const owner = ownerFrame?.node ?? currentRoot;
        appendSourceDetail(owner, value, factory);
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
    idRemap: Map<string, string>,
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
            mergeModelNodeIntoTarget(child, directMatch, idRemap, diagnostics);
            return;
        }

        const cloned = cloneNode(child);
        target.children = [...(target.children ?? []), cloned];
        mapClonedSubtreeIds(cloned, idRemap);
    });
}

function findDirectChildByLabel(parent: DiagramNode, label: string): DiagramNode | undefined {
    return (parent.children ?? []).find(child => comparisonLabel(child.label) === comparisonLabel(label));
}

function findNodeByLabel(
    nodes: readonly DiagramNode[],
    label: string
): DiagramNode | undefined {
    const targetLabel = comparisonLabel(label);
    for (const node of nodes) {
        if (comparisonLabel(node.label) === targetLabel) {
            return node;
        }
        const nested = findNodeByLabel(node.children ?? [], label);
        if (nested) {
            return nested;
        }
    }
    return undefined;
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
    roots: DiagramNode[],
    model: DiagramNode,
    idRemap: Map<string, string>,
    diagnostics: DiagramSourceCoverageDiagnostic[]
): void {
    const existing = roots.find(root => comparisonLabel(root.label) === comparisonLabel(model.label));
    if (existing) {
        mergeModelNodeIntoTarget(model, existing, idRemap, diagnostics);
        return;
    }

    const cloned = cloneNode(model);
    roots.push(cloned);
    mapClonedSubtreeIds(cloned, idRemap);
}

/**
 * Adds source-derived taxonomy without rewriting a valid semantic forest into
 * a document-rooted tree. The board consumes this forest directly; consumers
 * that need a document overview can explicitly request a separate projection.
 */
export function buildSourceCoverageForest(
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
    const mergedRoots = coverage.roots;

    const idRemap = new Map<string, string>();
    const diagnostics: DiagramSourceCoverageDiagnostic[] = [];
    const modelRoots = cloneModelForest(spec.nodes ?? []);
    modelRoots.forEach(modelRoot => {
        const sourceMatch = findNodeByLabel(mergedRoots, modelRoot.label);
        if (sourceMatch) {
            mergeModelNodeIntoTarget(modelRoot, sourceMatch, idRemap, diagnostics);
            return;
        }
        appendUnmatchedModelRoot(
            mergedRoots,
            modelRoot,
            idRemap,
            diagnostics
        );
    });

    return {
        ...spec,
        nodes: mergedRoots,
        edges: deduplicateAndRemapEdges(spec.edges ?? [], idRemap, mergedRoots, diagnostics),
        ...(diagnostics.length > 0 ? { sourceCoverageDiagnostics: diagnostics } : {})
    };
}

/**
 * An explicit overview policy for static delivery. Board generation must use
 * buildSourceCoverageForest() so an editable Drawnix artifact retains its
 * independent semantic roots.
 */
export function buildDocumentRootedKnowledgeMap(
    spec: DiagramSpec,
    sourceLabel: string
): DiagramSpec {
    if (spec.intent !== 'drawnixMindmap') {
        return spec;
    }

    const reservedIds = new Set<string>();
    collectNodeIds(spec.nodes ?? [], reservedIds);
    const factory = createSourceNodeFactory(reservedIds);
    const root = factory.create(boundedLabel(sourceLabel, spec.title || 'Generated diagram'), 'document');
    root.kind = 'root';
    root.children = (spec.nodes ?? []).map(cloneNode);

    return {
        ...spec,
        nodes: [root]
    };
}

/** @deprecated Use buildSourceCoverageForest() for new Drawnix generation. */
export function mergeDrawnixSourceCoverage(
    spec: DiagramSpec,
    sourceMarkdown: string,
    sourcePath?: string
): DiagramSpec {
    return buildSourceCoverageForest(spec, sourceMarkdown, sourcePath);
}
