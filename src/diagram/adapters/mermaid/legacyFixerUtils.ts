export interface ProtectedBracketBlocksResult {
    protectedText: string;
    blocks: string[];
}

export interface ParsedLegacyNodeNoteDirective {
    nodeId: string;
    text: string;
}

const DIRECTIONAL_NOTE_REGEX = /^\s*note\s+(?:right|left|top|bottom)\s+of\s+([a-zA-Z0-9_]+)\s*:\s*(.*)$/i;
const LEGACY_NOTE_FOR_OF_REGEX = /^\s*note\s+(?:for|of)\s+([a-zA-Z0-9_]+)\s+(.*)$/i;
const LEGACY_STANDALONE_NOTE_REGEX = /^\s*note\s*:\s*(.*)$/i;
const LEGACY_TARGETED_NOTE_REGEX = /^\s*note\s+([a-zA-Z0-9_]+)\s+"(.*)"\s*$/;

function stripWrappingDoubleQuotes(text: string): string {
    if (text.startsWith('"') && text.endsWith('"')) {
        return text.slice(1, -1);
    }

    return text;
}

export function protectTopLevelBracketBlocks(text: string): ProtectedBracketBlocksResult {
    const blocks: string[] = [];
    let protectedText = '';
    let depth = 0;
    let currentBlock = '';

    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (char === '[') {
            currentBlock += char;
            depth++;
            continue;
        }

        if (depth > 0) {
            currentBlock += char;
            if (char !== ']') {
                continue;
            }

            depth--;
            if (depth === 0) {
                protectedText += `___BRACKET_BLOCK_${blocks.length}___`;
                blocks.push(currentBlock);
                currentBlock = '';
            }
            continue;
        }

        protectedText += char;
    }

    if (currentBlock) {
        protectedText += currentBlock;
    }

    return {
        protectedText,
        blocks
    };
}

export function restoreProtectedBracketBlocks(text: string, blocks: string[]): string {
    return blocks.reduce((restored, block, index) => {
        const placeholder = `___BRACKET_BLOCK_${index}___`;
        return restored.split(placeholder).join(block);
    }, text);
}

export function buildLegacyConnectedNoteLines(nodeId: string, content: string): [string, string] {
    const noteId = `Note${nodeId}`;
    return [
        `${noteId}["${content}"]`,
        `${nodeId} -.- ${noteId}`
    ];
}

export function cleanLegacyTargetedNoteContent(content: string): string {
    return content.replace(/\[(?:\\?"){2}\\?\]/g, '');
}

export function parseDirectionalNoteDirective(line: string): ParsedLegacyNodeNoteDirective | null {
    const match = line.match(DIRECTIONAL_NOTE_REGEX);
    if (!match) {
        return null;
    }

    return {
        nodeId: match[1],
        text: match[2].trim()
    };
}

export function attachDirectionalNoteToConnection(line: string, nodeId: string, text: string): string | null {
    const escapedText = text.replace(/"/g, '\\"');
    const sourceRegex = new RegExp(`(?:^|\\s+)${nodeId}\\b(?:\\[.*?\\])?\\s*(---|-->)`);
    const targetRegex = new RegExp(`(---|-->)\\s*${nodeId}\\b(?:\\[.*?\\])?(?:;|$|\\s)`);

    if (sourceRegex.test(line)) {
        return line.replace(sourceRegex, (match) => {
            return match.replace(/\s*(---|-->)$/, (_arrowMatch, arrow) => ` -- "${escapedText}" ${arrow}`);
        });
    }

    if (targetRegex.test(line)) {
        return line.replace(targetRegex, (match) => {
            return match.replace(/^(---|-->)/, (arrow) => `-- "${escapedText}" ${arrow}`);
        });
    }

    return null;
}

export function parseLegacyForOfNoteDirective(line: string): ParsedLegacyNodeNoteDirective | null {
    const match = line.match(LEGACY_NOTE_FOR_OF_REGEX);
    if (!match) {
        return null;
    }

    let text = match[2].trim();
    if (text.endsWith(']')) {
        text = text.slice(0, -1).trim();
    }

    return {
        nodeId: match[1],
        text: stripWrappingDoubleQuotes(text)
    };
}

export function parseLegacyStandaloneNoteDirective(line: string): string | null {
    const match = line.match(LEGACY_STANDALONE_NOTE_REGEX);
    if (!match) {
        return null;
    }

    return stripWrappingDoubleQuotes(match[1].trim());
}

export function parseLegacyTargetedNoteDirective(line: string): ParsedLegacyNodeNoteDirective | null {
    const match = line.match(LEGACY_TARGETED_NOTE_REGEX);
    if (!match) {
        return null;
    }

    return {
        nodeId: match[1],
        text: match[2]
    };
}

export function mergeLegacyDoubleArrowLabelLine(line: string): string | null {
    const regex = /^(.*?)\s*(?<!-)--(?!>|-)\s*((?:(?!-->|---|(?<!-)--(?!>|-)\s).)*?)\s*(?<!-)--(?!>|-)\s*((?:(?!-->|---|(?<!-)--(?!>|-)\s).)*?)\s*(-->|---)\s*(.*)$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    const start = match[1];
    const arrow = match[4];
    const end = match[5];
    const label1 = stripWrappingDoubleQuotes(match[2].trim());
    const label2 = stripWrappingDoubleQuotes(match[3].trim());

    return `${start} -- "${label1}<br>${label2}" ${arrow} ${end}`;
}

export function quoteLegacyUnquotedEdgeLabelLine(line: string): string | null {
    const regex = /^(.*?)\s*(?<!-)--(?!>|-)\s*([^">]+?)\s*-->\s*(.*)$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    const start = match[1];
    const label = match[2].trim();
    const end = match[3];
    if (!label || label.startsWith('"')) {
        return null;
    }

    return `${start} -- "${label}" --> ${end}`;
}

export function rewriteLegacyQuotedLabelAfterSemicolonLine(line: string): string | null {
    if (!line.includes('-->')) {
        return null;
    }

    const match = line.match(/^(.*?)\s*(-->)\s*(.*?);\s*"([^"]+)"\s*$/);
    if (!match) {
        return null;
    }

    const source = match[1].trim();
    const arrow = match[2].trim();
    const target = match[3].trim();
    const label = match[4].trim();

    return `${source} -- "${label}" ${arrow} ${target};`;
}
