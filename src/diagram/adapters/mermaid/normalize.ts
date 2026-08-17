export type MermaidDiagramFamily =
    | 'classDiagram'
    | 'erDiagram'
    | 'flowchart'
    | 'gantt'
    | 'gitGraph'
    | 'mindmap'
    | 'sequenceDiagram'
    | 'stateDiagram'
    | 'unknown';

export interface NormalizedMermaidDiagram {
    content: string;
    family: MermaidDiagramFamily;
    hadFence: boolean;
    fence: '```' | '~~~' | null;
}

const MERMAID_FENCE_REGEX = /^(```|~~~)\s*mermaid\b[^\r\n]*\r?\n([\s\S]*?)\r?\n\s*\1\s*$/i;

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

function detectMermaidFamily(definition: string): MermaidDiagramFamily {
    const firstMeaningfulLine = definition
        .split('\n')
        .map(line => line.trim())
        .find(line => line.length > 0 && !line.startsWith('%%') && !line.startsWith('---'))
        ?.toLowerCase() || '';

    if (firstMeaningfulLine.startsWith('erdiagram')) return 'erDiagram';
    if (firstMeaningfulLine.startsWith('classdiagram')) return 'classDiagram';
    if (firstMeaningfulLine.startsWith('sequencediagram')) return 'sequenceDiagram';
    if (firstMeaningfulLine.startsWith('statediagram')) return 'stateDiagram';
    if (firstMeaningfulLine.startsWith('mindmap')) return 'mindmap';
    if (firstMeaningfulLine.startsWith('flowchart') || firstMeaningfulLine.startsWith('graph')) return 'flowchart';
    if (firstMeaningfulLine.startsWith('gantt')) return 'gantt';
    if (firstMeaningfulLine.startsWith('gitgraph')) return 'gitGraph';
    return 'unknown';
}

export function normalizeMermaidDiagram(content: string): NormalizedMermaidDiagram {
    const normalizedContent = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
    if (!normalizedContent) {
        return { content: '', family: 'unknown', hadFence: false, fence: null };
    }

    const fencedMatch = normalizedContent.match(MERMAID_FENCE_REGEX);
    const raw = (fencedMatch ? fencedMatch[2] : normalizedContent).trim();
    const family = detectMermaidFamily(raw);
    let normalized = sanitizeMermaidContent(raw);

    if (family === 'erDiagram') {
        normalized = repairBraceLessErEntityBlocks(normalized);
        normalized = repairTruncatedErRelationCardinality(normalized).trim();
    }

    return {
        content: normalized,
        family,
        hadFence: Boolean(fencedMatch),
        fence: fencedMatch ? fencedMatch[1] as '```' | '~~~' : null
    };
}

export function normalizeMermaidDefinition(content: string): string {
    return normalizeMermaidDiagram(content).content;
}
