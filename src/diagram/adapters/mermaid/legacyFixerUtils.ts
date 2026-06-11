export interface ProtectedBracketBlocksResult {
    protectedText: string;
    blocks: string[];
}

export interface ParsedLegacyNodeNoteDirective {
    nodeId: string;
    text: string;
}

export interface ParsedLegacyInlineSubgraphLabelLine {
    source: string;
    arrow: '---' | '-->';
    target: string;
    label: string;
}

export interface ParsedLegacyMermaidCommentLine {
    beforeComment: string;
    comment: string;
    hadTrailingSemicolon: boolean;
}

export interface ParsedLegacyDoubleSlashCommentLine {
    source: string;
    target: string;
    comment: string;
    hadTrailingSemicolon: boolean;
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

function stripWrappedQuotedLabel(text: string): string {
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

export function rewriteLegacyMisplacedPipeLine(line: string): string | null {
    const regex = /^\s*>\s*\|\s*"((?:[^"\\]|\\.)*)"\s*\|\s*(.*?)\s*(-->|---)\s*(.*)$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    const label = match[1];
    const source = match[2].trim();
    const arrow = match[3];
    const target = match[4].trim();

    return `${source} ${arrow}|"${label}"| ${target}`;
}

export function parseLegacyInlineSubgraphLabelLine(line: string): ParsedLegacyInlineSubgraphLabelLine | null {
    const regex = /^(.*?)\s*(---|-->)\s*(.*?);\s*subgraph\s+"(.*?)"\s*end;?\s*$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    return {
        source: match[1].trim(),
        arrow: match[2] as '---' | '-->',
        target: match[3].trim(),
        label: match[4].trim()
    };
}

export function rewriteLegacyInlineSubgraphLabelLine(line: string): string | null {
    const parsed = parseLegacyInlineSubgraphLabelLine(line);
    if (!parsed) {
        return null;
    }

    const bridgedArrow = parsed.arrow === '-->'
        ? ` -- "${parsed.label}" --> `
        : ` -- "${parsed.label}" --- `;

    return `${parsed.source}${bridgedArrow}${parsed.target};`;
}

export function parseLegacyMermaidCommentLine(line: string): ParsedLegacyMermaidCommentLine | null {
    if (!line.includes('%') || !line.includes('-->')) {
        return null;
    }

    const parts = line.split('%');
    let beforeComment = parts[0];
    let comment = '';
    let foundComment = false;

    for (let index = 1; index < parts.length; index++) {
        const potentialCode = parts.slice(0, index).join('%');
        const quoteCount = (potentialCode.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) {
            beforeComment = potentialCode;
            comment = parts.slice(index).join('%').trim();
            foundComment = true;
            break;
        }
    }

    if (!foundComment || !comment) {
        return null;
    }

    let normalizedCode = beforeComment.trim();
    let hadTrailingSemicolon = false;
    if (normalizedCode.endsWith(';')) {
        normalizedCode = normalizedCode.slice(0, -1).trim();
        hadTrailingSemicolon = true;
    }

    return {
        beforeComment: normalizedCode,
        comment,
        hadTrailingSemicolon
    };
}

export function rewriteLegacyMermaidCommentLine(line: string): string | null {
    const parsed = parseLegacyMermaidCommentLine(line);
    if (!parsed) {
        return null;
    }

    const arrowLabelRegex = /^(.*?)(--\s*)(.*?)(\s*-->\s*)(.*?)$/;
    const match = parsed.beforeComment.match(arrowLabelRegex);
    if (!match) {
        return null;
    }

    const pre = match[1];
    const arrowStart = match[2];
    const label = stripWrappedQuotedLabel(match[3]);
    const arrowEnd = match[4];
    const post = match[5];
    const newLabel = `${label}(${parsed.comment})`;

    return `${pre}${arrowStart}"${newLabel}"${arrowEnd}${post}${parsed.hadTrailingSemicolon ? ';' : ''}`;
}

export function rewriteLegacyInvalidArrowSyntax(text: string): string {
    return text.replace(/--\|>/g, '-->');
}

export function rewriteLegacyBlankArrowSyntax(text: string): string {
    return text.replace(/-- >/g, '-->');
}

export function parseLegacyDoubleSlashCommentLine(line: string): ParsedLegacyDoubleSlashCommentLine | null {
    const regex = /^(.*?)(\s*-->\s*)(.*?)(;?)\s*\/\/\s*(.*)$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    const source = match[1];
    const target = match[3].trim();
    const hadTrailingSemicolon = match[4] === ';';
    const comment = match[5].trim();
    if (!comment) {
        return null;
    }

    return {
        source,
        target,
        comment,
        hadTrailingSemicolon
    };
}

export function rewriteLegacyDoubleSlashCommentLine(line: string): string | null {
    const parsed = parseLegacyDoubleSlashCommentLine(line);
    if (!parsed) {
        return null;
    }

    return `${parsed.source} -- "${parsed.comment}" --> ${parsed.target}${parsed.hadTrailingSemicolon ? ';' : ''}`;
}

export function rewriteLegacyDuplicateQuotedLabelChain(line: string): string {
    const blockRegexStr = '\\["(?:[^"\\\\]|\\\\.)*"\\]';
    const blockRegex = new RegExp(blockRegexStr, 'g');
    const chainRegex = new RegExp(`((?:${blockRegexStr}\\s*){2,})`, 'g');

    return line.replace(chainRegex, (match) => {
        const blocks = match.match(blockRegex);
        if (!blocks || blocks.length === 0) {
            return match;
        }

        return blocks[blocks.length - 1];
    });
}

export function rewriteLegacyDoubleDashArrow(line: string): string | null {
    if (!line.trim().endsWith(';')) {
        return null;
    }

    const regex = /^(.*?)(\s*)(?<!-)--(?!>|-)(\s*)((?:(?!--|-->).)*?);\s*$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    const prefix = match[1];
    const leftSpace = match[2];
    const rightSpace = match[3];
    const suffix = match[4];

    return `${prefix}${leftSpace}-->${rightSpace}${suffix};`;
}

export const rewriteLegacyTrailingDoubleDashArrow = rewriteLegacyDoubleDashArrow;

export function rewriteLegacyShapeMismatch(text: string): string {
    let processed = text;
    processed = processed.replace(/\[\/\["/g, '["');
    processed = processed.replace(/\["\/\]/g, '"]');
    return processed;
}

export function rewriteLegacyPlaceholderArtifacts(text: string): string {
    return text.replace(/___BRACKET_BLOCK_\d+___/g, '');
}

export function rewriteLegacyReverseArrowLine(line: string): string | null {
    if (!line.includes('<--')) {
        return null;
    }

    const regex = /^(.*?)\s*<--\s*(.*?)(;?)\s*$/;
    const match = line.match(regex);
    if (!match) {
        return null;
    }

    const leftNode = match[1].trim();
    const rightNode = match[2].trim();
    const semicolon = match[3] || '';

    return `${rightNode} --> ${leftNode}${semicolon}`;
}

export function rewriteLegacySubgraphDirectionLine(line: string, insideSubgraph: boolean): string {
    if (!insideSubgraph) {
        return line;
    }

    return line.replace(/^\s*Direction\s+(TB|BT|LR|RL|TD)\b/g, (match) => {
        return match.replace('Direction', 'direction');
    });
}
