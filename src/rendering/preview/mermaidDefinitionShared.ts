const MERMAID_FENCE_REGEX = /^(?:```|~~~)\s*mermaid\b[^\n]*\n([\s\S]*?)\n(?:```|~~~)\s*$/i;

function repairTruncatedErRelationCardinality(definition: string): string {
    return definition
        .split('\n')
        .map((line) => {
            let repaired = line;

            // Repair a missing leading `}` in left-side many cardinalities, e.g. `o--||`.
            repaired = repaired.replace(
                /^(\s*\S+\s+)o(--|\.\.)(?=(\|\||\|o|o\{)\s+\S+\s*:)/,
                '$1}o$2'
            );

            // Repair a missing trailing `{` in right-side many cardinalities, e.g. `||--o`.
            repaired = repaired.replace(
                /(\|\||\|o|\}\||\}o)(--|\.\.)(o)(?=\s+\S+\s*:)/,
                '$1$2o{'
            );

            return repaired;
        })
        .join('\n');
}

function isErAttributeLine(line: string): boolean {
    return /^\s*[a-z][a-z0-9_]*\s+[a-z][a-z0-9_]*\s*$/i.test(line);
}

function repairBraceLessErEntityBlocks(definition: string): string {
    const lines = definition.split('\n').map((line) => line.trimEnd());
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

        const [_, baseIndent, entityName] = entityMatch;
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
        attributes.forEach((attribute) => {
            rebuilt.push(`${baseIndent}    ${attribute}`);
        });
        rebuilt.push(`${baseIndent}}`);
        index = cursor - 1;
    }

    return rebuilt.join('\n');
}

function sanitizeMermaidContent(definition: string): string {
    let sanitized = definition.split('\n').map((line) => line.trimEnd()).join('\n');

    sanitized = sanitized.replace(/^(\s+)([A-Z_][A-Z0-9_]*)\s+$/gm, '$1$2');
    sanitized = sanitized.replace(/^( {4})([a-z][a-z0-9_]*)\s+([a-z][a-z0-9_]*\b)/gm, '$1$2 $3');

    if (sanitized.trimStart().toLowerCase().startsWith('erdiagram')) {
        sanitized = repairBraceLessErEntityBlocks(sanitized);
        sanitized = repairTruncatedErRelationCardinality(sanitized);
    }

    return sanitized.trim();
}

export function normalizeMermaidDefinition(content: string): string {
    const normalizedContent = content.replace(/\r\n?/g, '\n');
    const trimmed = normalizedContent.trim();
    if (!trimmed) {
        return '';
    }

    const fencedMatch = trimmed.match(MERMAID_FENCE_REGEX);
    const raw = (fencedMatch ? fencedMatch[1] : trimmed).trim();
    return sanitizeMermaidContent(raw);
}
