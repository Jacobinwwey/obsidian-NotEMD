export type MermaidDiagramFamily =
    | 'architecture'
    | 'block'
    | 'c4'
    | 'classDiagram'
    | 'erDiagram'
    | 'flowchart'
    | 'gantt'
    | 'gitGraph'
    | 'journey'
    | 'kanban'
    | 'mindmap'
    | 'packet'
    | 'pie'
    | 'quadrantChart'
    | 'radar'
    | 'requirement'
    | 'sankey'
    | 'sequenceDiagram'
    | 'stateDiagram'
    | 'timeline'
    | 'treemap'
    | 'xyChart'
    | 'zenUML'
    | 'unknown';

export interface NormalizedMermaidDiagram {
    content: string;
    family: MermaidDiagramFamily;
    hadFence: boolean;
    fence: '```' | '~~~' | null;
}

export interface MermaidBlock {
    marker: '```' | '~~~';
    openingLine: string;
    content: string;
    closingLine: string;
    startLine: number;
    endLine: number;
}

export const CANONICAL_MERMAID_FENCE = '```' as const;

export function openMermaidFence(): string {
    return `${CANONICAL_MERMAID_FENCE}mermaid`;
}

export function closeMermaidFence(): string {
    return CANONICAL_MERMAID_FENCE;
}

export function fenceMermaidDefinition(content: string): string {
    const normalized = normalizeLineEndings(content).trim();
    return `${openMermaidFence()}\n${normalized}\n${closeMermaidFence()}`;
}

const MERMAID_FENCE_OPEN_REGEX = /^(\s*)(```|~~~)\s*\(?\s*mermaid\s*\)?(?:\s+[^\r\n]*)?\s*$/i;
const MERMAID_FENCE_CLOSE_REGEX = /^(\s*)(```|~~~)\s*$/;

function normalizeLineEndings(content: string): string {
    return content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function parseMermaidFenceOpening(line: string): { marker: '```' | '~~~' } | null {
    const match = line.match(MERMAID_FENCE_OPEN_REGEX);
    if (!match) {
        return null;
    }

    return { marker: match[2] as '```' | '~~~' };
}

/**
 * Scans markdown once so validation and repair cannot disagree about fence ownership.
 * Only closed blocks are returned; callers that repair unclosed blocks keep that policy explicit.
 */
export function extractMermaidBlocks(content: string): MermaidBlock[] {
    const lines = normalizeLineEndings(content).split('\n');
    const blocks: MermaidBlock[] = [];

    for (let startLine = 0; startLine < lines.length; startLine += 1) {
        const opening = parseMermaidFenceOpening(lines[startLine]);
        if (!opening) {
            continue;
        }

        let endLine = startLine + 1;
        while (endLine < lines.length) {
            const closing = lines[endLine].match(MERMAID_FENCE_CLOSE_REGEX);
            if (closing && closing[2] === opening.marker) {
                blocks.push({
                    marker: opening.marker,
                    openingLine: lines[startLine],
                    content: lines.slice(startLine + 1, endLine).join('\n'),
                    closingLine: lines[endLine],
                    startLine,
                    endLine
                });
                startLine = endLine;
                break;
            }
            endLine += 1;
        }
    }

    return blocks;
}

export function mapMermaidBlocks(
    content: string,
    transform: (block: MermaidBlock) => string
): string {
    const normalizedContent = normalizeLineEndings(content);
    const lines = normalizedContent.split('\n');
    const blocks = extractMermaidBlocks(normalizedContent);
    if (blocks.length === 0) {
        return normalizedContent;
    }

    const output: string[] = [];
    let cursor = 0;
    for (const block of blocks) {
        output.push(...lines.slice(cursor, block.startLine));
        const transformed = transform(block);
        output.push(block.openingLine);
        if (transformed.length > 0) {
            output.push(transformed);
        }
        output.push(block.closingLine);
        cursor = block.endLine + 1;
    }
    output.push(...lines.slice(cursor));
    return output.join('\n');
}

function readSingleFencedDefinition(content: string): { raw: string; marker: '```' | '~~~' } | null {
    const lines = content.split('\n');
    const opening = parseMermaidFenceOpening(lines[0] ?? '');
    if (!opening) {
        return null;
    }

    let closingLine = -1;
    for (let index = 1; index < lines.length; index += 1) {
        const closing = lines[index].match(MERMAID_FENCE_CLOSE_REGEX);
        if (closing && closing[2] === opening.marker) {
            closingLine = index;
            break;
        }
    }

    if (closingLine < 0 || lines.slice(closingLine + 1).some(line => line.trim().length > 0)) {
        return null;
    }

    return {
        raw: lines.slice(1, closingLine).join('\n'),
        marker: opening.marker
    };
}

function isErAttributeLine(line: string): boolean {
    return /^\s*[a-z][a-z0-9_]*\s+[a-z][a-z0-9_]*\s*$/i.test(line);
}

function repairBraceLessErEntityBlocks(definition: string): string {
    const lines = definition.split('\n').map(line => line.trimEnd());
    const rebuilt: string[] = [];

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const entityMatch = line.match(/^(\s*)([A-Z_][A-Z0-9_]*)\s*$/);

        if (!entityMatch) {
            if (line.trim().length > 0) {
                rebuilt.push(line);
            }
            continue;
        }

        const [, baseIndent, entityName] = entityMatch;
        const attributes: string[] = [];
        let cursor = index + 1;

        while (cursor < lines.length) {
            const candidate = lines[cursor];
            if (candidate.trim().length === 0) {
                cursor += 1;
                continue;
            }
            if (!isErAttributeLine(candidate)) {
                break;
            }
            attributes.push(candidate.trim());
            cursor += 1;
        }

        if (attributes.length === 0) {
            rebuilt.push(line);
            continue;
        }

        rebuilt.push(`${baseIndent}${entityName} {`);
        attributes.forEach(attribute => {
            rebuilt.push(`${baseIndent}    ${attribute}`);
        });
        rebuilt.push(`${baseIndent}}`);
        index = cursor - 1;
    }

    return rebuilt.join('\n');
}

function repairTruncatedErRelationCardinality(definition: string): string {
    return definition
        .split('\n')
        .map(line => {
            let repaired = line;

            repaired = repaired.replace(
                /^(\s*\S+\s+)o(--|\.\.)(?=(\|\||\|o|o\{)\s+\S+\s*:)/,
                '$1}o$2'
            );
            repaired = repaired.replace(
                /(\|\||\|o|\}\||\}o)(--|\.\.)(o)(?=\s+\S+\s*:)/,
                '$1$2o{'
            );

            return repaired;
        })
        .join('\n');
}

function sanitizeMermaidContent(definition: string): string {
    let sanitized = definition
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n');

    sanitized = sanitized.replace(/^(\s+)([A-Z_][A-Z0-9_]*)\s+$/gm, '$1$2');
    sanitized = sanitized.replace(/^( {4})([a-z][a-z0-9_]*)\s+([a-z][a-z0-9_]*\b)/gm, '$1$2 $3');

    return sanitized.trim();
}

const MERMAID_FAMILY_PREFIXES: readonly (readonly [string, MermaidDiagramFamily])[] = [
    ['architecture-beta', 'architecture'],
    ['block-beta', 'block'],
    ['c4component', 'c4'],
    ['c4container', 'c4'],
    ['c4context', 'c4'],
    ['c4deployment', 'c4'],
    ['c4dynamic', 'c4'],
    ['classdiagram', 'classDiagram'],
    ['erdiagram', 'erDiagram'],
    ['flowchart', 'flowchart'],
    ['graph', 'flowchart'],
    ['gantt', 'gantt'],
    ['gitgraph', 'gitGraph'],
    ['journey', 'journey'],
    ['kanban', 'kanban'],
    ['mindmap', 'mindmap'],
    ['packet-beta', 'packet'],
    ['pie', 'pie'],
    ['quadrantchart', 'quadrantChart'],
    ['radar-beta', 'radar'],
    ['requirementdiagram', 'requirement'],
    ['sankey-beta', 'sankey'],
    ['sequencediagram', 'sequenceDiagram'],
    ['statediagram', 'stateDiagram'],
    ['timeline', 'timeline'],
    ['treemap', 'treemap'],
    ['xychart-beta', 'xyChart'],
    ['zenuml', 'zenUML']
];

function hasMermaidFamilyPrefix(header: string, prefix: string): boolean {
    if (!header.startsWith(prefix)) {
        return false;
    }

    if (header === prefix) {
        return true;
    }

    const suffix = header.slice(prefix.length);
    return suffix.startsWith(' ') || suffix.startsWith('\t') || suffix.startsWith('-');
}

export function detectMermaidFamily(definition: string): MermaidDiagramFamily {
    const firstMeaningfulLine = definition
        .split('\n')
        .map(line => line.trim())
        .find(line => line.length > 0
            && line.toLowerCase() !== 'mermaid'
            && !line.startsWith('%%')
            && !line.startsWith('---'))
        ?.toLowerCase() || '';

    const family = MERMAID_FAMILY_PREFIXES.find(([prefix]) => hasMermaidFamilyPrefix(firstMeaningfulLine, prefix));
    if (family) {
        return family[1];
    }
    return 'unknown';
}

export function normalizeMermaidDiagram(content: string): NormalizedMermaidDiagram {
    const normalizedContent = normalizeLineEndings(content).trim();
    if (!normalizedContent) {
        return { content: '', family: 'unknown', hadFence: false, fence: null };
    }

    const fenced = readSingleFencedDefinition(normalizedContent);
    const raw = (fenced ? fenced.raw : normalizedContent).trim();
    const family = detectMermaidFamily(raw);
    let normalized = sanitizeMermaidContent(raw);

    if (family === 'erDiagram') {
        normalized = repairBraceLessErEntityBlocks(normalized);
        normalized = repairTruncatedErRelationCardinality(normalized).trim();
    }

    return {
        content: normalized,
        family,
        hadFence: Boolean(fenced),
        fence: fenced?.marker ?? null
    };
}

export function normalizeMermaidDefinition(content: string): string {
    return normalizeMermaidDiagram(content).content;
}
