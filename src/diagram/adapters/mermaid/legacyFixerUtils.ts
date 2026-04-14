export interface ProtectedBracketBlocksResult {
    protectedText: string;
    blocks: string[];
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
