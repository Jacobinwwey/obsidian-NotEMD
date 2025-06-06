/**
 * Processes markdown content to validate and fix Mermaid syntax issues.
 * Specifically ensures that ```mermaid blocks are properly closed after the last arrow (`-->`).
 * Adapted from logic in LMStudio-Markdown-Content-Generator/mermaid.py.
 */
export function refineMermaidBlocks(content: string): string {
	const lines = content.split('\n');
	let resultLines: string[] = [];
	let inMermaid = false;
	let currentBlockLines: string[] = [];
	let lastArrowIndexInBlock = -1;

	for (let line of lines) { // Use 'let' so we can modify the line
		const stripped = line.trim();

		// Regex to detect ```(mermaid) or ``` mermaid with optional space/parentheses
		const mermaidStartRegex = /^```\s*\(?\s*mermaid\s*\)?/;


		if (mermaidStartRegex.test(stripped)) {
			// Normalize the starting line
			line = line.replace(mermaidStartRegex, '```mermaid');

			// If already in a block, finish the previous one before starting new
			if (inMermaid) {
				if (lastArrowIndexInBlock !== -1) {
					// Ensure the line after the last arrow isn't already the closer
					if (currentBlockLines[lastArrowIndexInBlock + 1]?.trim() !== '```') {
						currentBlockLines.splice(lastArrowIndexInBlock + 1, 0, '```');
					}
				} else if (currentBlockLines.length > 0) {
                    // Block started but no arrows, ensure it's closed if not already
                     if (currentBlockLines[0].trim().startsWith('```mermaid') && currentBlockLines[currentBlockLines.length - 1].trim() !== '```') {
                         // Check if the line after start isn't the closer
                         if (currentBlockLines.length === 1 || currentBlockLines[1]?.trim() !== '```') {
                            currentBlockLines.splice(1, 0, '```'); // Close after the opening line
                         }
                     }
                }
				resultLines.push(...currentBlockLines);
			}
			// Start new block
			inMermaid = true;
			currentBlockLines = [line];
			lastArrowIndexInBlock = -1;
		} else if (inMermaid) {
			// Apply new quote rules BEFORE removing brackets, ONLY if 'subgraph' is NOT on the line
			if (!line.includes('subgraph')) {
				// 先保护 |" 和 "| 的情况
				const placeholder = '___PROTECTED_QUOTE___';
				line = line.replace(/\|"/g, `|${placeholder}`);
				line = line.replace(/"\|/g, `${placeholder}|`);

				// Rule 1 (Revised - No Lookbehind):
				// 1a: Handle quote at the start of the line
				line = line.replace(/^"(?!;|\s)(?!\])/g, '["');
				// 1b: Handle quote preceded by a non-space, non-[ character
				line = line.replace(/([^\s\[])"(?!;|\s)(?!\])/g, '$1["');

				// Rule 2: Replace "; with ];
				line = line.replace(/";/g, '"];');

				// 还原被保护的引号
				line = line.replace(new RegExp(placeholder, 'g'), '"');
				
				// Rule 3: Replace ["; with "];
				line = line.replace(/\[";/g, '"];');
				// New Rule 4: Replace ?["; with ?"];
				line = line.replace(/\?\[";/g, '?"];');
				
				// 添加额外的清理步骤，确保没有残留的[";模式
				// 重复应用Rule 3直到没有更多的[";模式
				while (line.includes('[";')) {
					line = line.replace(/\[";/g, '"];');
					
					// New Rule 4: Replace ?["; with ?"];
					line = line.replace(/\?\[";/g, '?"];');
				}
                // Safeguard: Final replacements to ensure ["; and ?["; are corrected
                line = line.replace(/\[";/g, '"];');
                line = line.replace(/\?\[";/g, '?"];');

				// New User Rule 1: If line ends with [;";, change to "];
				line = line.replace(/\[";$/, '"];');
				// New User Rule 2: Then, if line ends with [", change to "]
				line = line.replace(/\["$/, '"]');
			}


			// Remove parentheses and curly braces from the line content within the mermaid block
			const lineWithoutBrackets = line.replace(/[(){}]/g, ''); // Updated regex
			currentBlockLines.push(lineWithoutBrackets);
			if (lineWithoutBrackets.includes('-->')) { // Check the modified line for arrows
				lastArrowIndexInBlock = currentBlockLines.length - 1; // Index within currentBlockLines
			}
			if (stripped === '```') {
				// Found the intended closing tag, finalize this block
				resultLines.push(...currentBlockLines);
				inMermaid = false;
				currentBlockLines = [];
				lastArrowIndexInBlock = -1;
			}
		} else {
			// Line outside any mermaid block
			resultLines.push(line);
		}
	}

	// Handle unclosed block at the very end of the file
	if (inMermaid) {
		if (lastArrowIndexInBlock !== -1) {
			// Ensure the line after the last arrow isn't already the closer
            // Check if the index exists before accessing trim()
			if (lastArrowIndexInBlock + 1 >= currentBlockLines.length || currentBlockLines[lastArrowIndexInBlock + 1]?.trim() !== '```') {
				currentBlockLines.splice(lastArrowIndexInBlock + 1, 0, '```');
			}
		} else if (currentBlockLines.length > 0) {
            // Block started but no arrows, ensure it's closed if not already
            if (currentBlockLines[0].trim().startsWith('```mermaid') && currentBlockLines[currentBlockLines.length - 1].trim() !== '```') {
                 // Check if the line after start isn't the closer
                 if (currentBlockLines.length === 1 || currentBlockLines[1]?.trim() !== '```') {
                    currentBlockLines.splice(1, 0, '```'); // Close after the opening line
                 } else if (currentBlockLines[currentBlockLines.length -1].trim() !== '```') {
                     // If it wasn't closed after line 1, add closer at the end
                     currentBlockLines.push('```');
                 }
            } else if (currentBlockLines[currentBlockLines.length -1].trim() !== '```') {
                 // Failsafe if somehow the last line isn't a closer
                 currentBlockLines.push('```');
            }
        }
		resultLines.push(...currentBlockLines);
	}

	return resultLines.join('\n');
}

/**
 * Cleans up LaTeX math delimiters.
 * Converts \( and \) to $.
 * Removes extra spaces around $.
 * Ensures space before $ if preceded by a hyphen.
 * Removes \$ escape sequence.
 *
 * @param content The markdown content string.
 * @returns Content with cleaned math delimiters.
 */
export function cleanupLatexDelimiters(content: string): string {
	const placeholder = '___TEMP_DOLLAR_ESCAPE___';
	let processed = content;

	// 1. Protect escaped dollars
	processed = processed.replace(/\\\$/g, placeholder);

	// 2. Convert \( and \) to $
	processed = processed.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

	// 3. Trim whitespace inside single $...$ (non-greedy)
	// This regex finds a $ followed by optional whitespace, captures the content (non-greedily),
	// followed by optional whitespace and a closing $. It replaces the whole match with $content$.
	// It avoids matching $$ by ensuring the captured content doesn't start or end with $.
	processed = processed.replace(/\$\s*([^$]*?)\s*\$/g, (match, group1) => {
        // Avoid affecting display math $$...$$
        if (match.startsWith('$$') && match.endsWith('$$')) {
            return match; // Leave display math untouched
        }
        // Trim the captured group and reconstruct
        const trimmedGroup = group1.trim();
        return `$${trimmedGroup}$`;
    });


	// 4. Restore escaped dollars
	processed = processed.replace(new RegExp(placeholder, 'g'), '$');

	return processed;
}
