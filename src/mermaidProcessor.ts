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
			// Handle ; # comments - convert to labeled arrows
			const commentMatch = line.match(/^(\w+)\s*-->\s*(\w+);\s*#(.*)$/);
			if (commentMatch) {
				line = `${commentMatch[1]} -- "${commentMatch[3].trim()}" --> ${commentMatch[2]};`;
			}

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

                // New User Rule 3: Fix broken edge labels `--["Text["-->` to `-- "Text" -->`
                // Example: `CapRate --["Inverse Relationship["-->` becomes `CapRate -- "Inverse Relationship" -->`
                line = line.replace(/--\s*\["(.+?)\["\s*-->/g, '-- "$1" -->');

                // --- User Requested "Fix Mode" Logic for [ ... ] ---
                // Detects Node[Label] where Label isn't fully quoted but contains brackets/quotes.
                // Targeted cases:
                // 1. `Investment[Corporate Investment "[企业投资]"]` -> `Investment["Corporate Investment [企业投资]"]`
                // 2. `Consumption[Consumption [消费]]` -> `Consumption["Consumption [消费]"]`
                // 3. `WhiteDwarf[白矮星 [White Dwarf]]` -> `WhiteDwarf["白矮星 [White Dwarf]"]`
                
                // Improved regex to handle one level of nested brackets:
                // ([^\s\[]+)  : NodeID (non-whitespace AND non-[ chars)
                // \s*\[       : Opening bracket
                // (?!"|')     : Content does NOT start with " or ' (already quoted nodes are skipped)
                // (           : Start capturing content
                //   (?:       : Non-capturing group for content parts
                //     [^\[\]] : Any character EXCEPT [ or ]
                //     |       : OR
                //     \[[^\[\]]*\] : A nested [...] block with no brackets inside
                //   )*        : Repeat content parts
                // )           : End capturing content
                // \]          : Closing bracket
                
                line = line.replace(/([^\s\[]+)\s*\[(?!"|')((?:[^\[\]]|\[[^\[\]]*\])*)\]/g, (match, nodeId, content) => {
                     // Filter out matches that don't actually contain broken characters we care about.
                     // The regex already excludes things starting with ".
                     // We specifically want to fix things that have [ or ] inside.
                     if (/[\[\]|]/.test(content)) {
                         // Logic:
                         // 1. Remove existing double quotes from content to avoid syntax errors (as per user example where inner quotes were removed).
                         // 2. Wrap in double quotes.
                         const cleanContent = content.replace(/"/g, ''); 
                         return `${nodeId}["${cleanContent}"]`;
                     }
                     return match;
                });
			}


			// Remove parentheses and curly braces from the line content within the mermaid block
			let lineWithoutBrackets = line.replace(/[(){}]/g, ''); // Updated regex

			// Fix [" at the end of the line
			if (lineWithoutBrackets.endsWith('\["')) {
				lineWithoutBrackets = lineWithoutBrackets.slice(0, -2) + '"]';
			}

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

/**
 * Deep debug function for Mermaid syntax.
 * Scans for nodes following arrows that are missing brackets but have trailing content before the semicolon.
 * Example: `... --> SpreadCalc价差计算 Spread Calculation;` -> `... --> SpreadCalc[价差计算 Spread Calculation];`
 * This function prepares the code for `refineMermaidBlocks` to handle the quoting.
 */
export function deepDebugMermaid(content: string): string {
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
        // Skip if not in a mermaid block context?
        // The user says "In all instances where the format begins with `words --` or `words -->`".
        // We can check if the line looks like a graph edge.
        if (!line.includes('-->') && !line.includes('---') && !line.includes('--')) {
            return line;
        }

        // Regex to find:
        // 1. Arrow (including labeled arrows like -- "label" -->)
        // 2. ASCII NodeID ([a-zA-Z0-9_]+)
        // 3. Content that is NOT empty, has NO brackets, and ends at ;
        // We capture groups to reconstruct.
        
        // Regex explanation:
        // ((?:---|-->|--\s*"[^"]*"\s*-->)\s*) : Group 1 - Arrow prefix (simple or labeled)
        // ([a-zA-Z0-9_]+\b)                   : Group 2 - Node ID (ASCII + word boundary)
        // ([^\[\];\n]+)                       : Group 3 - The "Label" part (must act have brackets)
        // (;)                                 : Group 4 - The terminating semicolon
        
        // Note: [^\[\];\n]+ ensures we don't match if there ARE brackets already.
        // It also ensures we match the text between ID and semicolon.
        
        const regex = /((?:---|-->|--\s*"[^"]*"\s*-->)\s*)([a-zA-Z0-9_]+\b)([^\[\];\n]+)(;)/g;
        
        if (regex.test(line)) {
             return line.replace(regex, '$1$2[$3]$4');
        }
        
        return line;
    });
    return processedLines.join('\n');
}
