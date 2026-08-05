import { DiagramNode, DiagramSpec } from '../../types';

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

function findNodeByLabel(nodes: readonly DiagramNode[], label: string): DiagramNode | undefined {
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

function appendCoverageRoot(nodes: DiagramNode[], root: DiagramNode): void {
    const existing = nodes.find(node => comparisonLabel(node.label) === comparisonLabel(root.label));
    if (existing) {
        mergeNodeChildren(existing, root.children ?? []);
        return;
    }
    nodes.push(root);
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

function appendMermaidNode(
    parent: DiagramNode,
    label: string,
    nodeId: string,
    factory: SourceNodeFactory
): void {
    const key = comparisonLabel(label);
    const existing = (parent.children ?? []).find(child => comparisonLabel(child.label) === key);
    if (existing) {
        return;
    }
    const node = factory.create(label, `mermaid-node-${nodeId}`);
    parent.children = [...(parent.children ?? []), node];
}

function parseMermaidBlock(
    lines: readonly string[],
    ordinal: number,
    factory: SourceNodeFactory
): DiagramNode {
    const directive = lines.find(line => line.trim().length > 0)?.trim() ?? 'diagram';
    const root = factory.create(`Mermaid ${directive.split(/\s+/)[0]} ${ordinal}`, 'mermaid');
    let currentGroup: DiagramNode | undefined;
    let genericGroup: DiagramNode | undefined;
    let participantGroup: DiagramNode | undefined;

    const ensureGenericGroup = (): DiagramNode => {
        if (!genericGroup) {
            genericGroup = factory.create('Mermaid nodes', 'mermaid-nodes');
            root.children = [...(root.children ?? []), genericGroup];
        }
        return genericGroup;
    };

    lines.forEach(line => {
        const subgraphLabel = extractSubgraphLabel(line);
        if (subgraphLabel) {
            const group = factory.create(subgraphLabel, 'mermaid-group');
            root.children = [...(root.children ?? []), group];
            currentGroup = group;
            return;
        }
        if (/^\s*end\s*$/i.test(line)) {
            currentGroup = undefined;
            return;
        }

        const participant = line.match(/^\s*participant\s+([^\s]+)(?:\s+as\s+(.+))?\s*$/i);
        if (participant) {
            participantGroup ??= factory.create('Participants', 'mermaid-participants');
            if (!(root.children ?? []).includes(participantGroup)) {
                root.children = [...(root.children ?? []), participantGroup];
            }
            appendMermaidNode(
                participantGroup,
                participant[2] ?? participant[1],
                participant[1],
                factory
            );
            return;
        }

        extractMermaidLabels(line).forEach(mermaidNode => {
            appendMermaidNode(currentGroup ?? ensureGenericGroup(), mermaidNode.label, mermaidNode.id, factory);
        });
    });

    return root;
}

function buildSourceCoverageNodes(sourceMarkdown: string, factory: SourceNodeFactory): DiagramNode[] {
    const lines = sourceMarkdown.split(/\r?\n/);
    const roots: DiagramNode[] = [];
    const headings: HeadingFrame[] = [];
    let currentRoot: DiagramNode | undefined;
    let inFence = false;
    let fenceMarker = '';
    let mermaidLines: string[] | undefined;
    let mermaidOrdinal = 0;

    const appendMermaidRoot = (blockLines: string[]): void => {
        if (blockLines.length === 0) {
            return;
        }
        const visualRoot = parseMermaidBlock(blockLines, ++mermaidOrdinal, factory);
        if (currentRoot) {
            appendChildByLabel(currentRoot, visualRoot);
        } else {
            appendCoverageRoot(roots, visualRoot);
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
            if (heading.level === 2 || !currentRoot) {
                const root = factory.create(heading.label, 'section');
                roots.push(root);
                currentRoot = root;
                headings.splice(0, headings.length, { level: heading.level, node: root });
                return;
            }

            while (headings.length > 0 && headings[headings.length - 1].level >= heading.level) {
                headings.pop();
            }
            const parent = headings[headings.length - 1];
            if (!parent) {
                return;
            }
            const child = factory.create(heading.label, 'section');
            parent.node.children = [...(parent.node.children ?? []), child];
            headings.push({ level: heading.level, node: child });
            return;
        }

        if (!currentRoot) {
            return;
        }
        const value = detailText(line);
        if (!value) {
            return;
        }
        const ownerFrame = headings[headings.length - 1];
        const owner = ownerFrame?.node ?? currentRoot;
        const ownerDepth = Math.max(0, headings.length - 1);
        appendSourceDetail(owner, ownerDepth, value, factory);
    });

    if (mermaidLines) {
        appendMermaidRoot(mermaidLines);
    }

    return roots;
}

/**
 * Adds deterministic source-derived taxonomy to a model-generated Drawnix map.
 * The exact source visuals remain companions; this layer makes the native tree
 * useful even when the LLM returns only a small summary of a long note.
 */
export function mergeDrawnixSourceCoverage(spec: DiagramSpec, sourceMarkdown: string): DiagramSpec {
    if (spec.intent !== 'drawnixMindmap' || !sourceMarkdown.trim()) {
        return spec;
    }

    const reservedIds = new Set<string>();
    collectNodeIds(spec.nodes ?? [], reservedIds);
    const factory = createSourceNodeFactory(reservedIds);
    const coverageRoots = buildSourceCoverageNodes(sourceMarkdown, factory);
    if (coverageRoots.length === 0) {
        return spec;
    }

    const mergedNodes = (spec.nodes ?? []).map(cloneNode);
    coverageRoots.forEach(root => appendCoverageRoot(mergedNodes, root));
    return {
        ...spec,
        nodes: mergedNodes
    };
}
