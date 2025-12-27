import mermaid from 'mermaid';

/**
 * Checks if the content contains any Mermaid syntax errors using mermaid.parse.
 * @param content The markdown content to check.
 * @returns A promise that resolves to the number of errors found.
 */
export async function checkMermaidErrors(content: string): Promise<number> {
    const mermaidBlockRegex = /^(?:[ \t]*)(?:```|~~~)\s*mermaid\b[^\n]*\n([\s\S]*?)\n(?:[ \t]*)(?:```|~~~)/gim;
    let match;
    let errorCount = 0;
    
    // Initialize mermaid if needed (though usually handled by the app/plugin load)
    // We use a safe configuration
    mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });

    while ((match = mermaidBlockRegex.exec(content)) !== null) {
        try {
            await mermaid.parse(match[1]);
        } catch (error) {
            errorCount++;
        }
    }
    return errorCount;
}

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
 * Applies all available fixes in a specific order.
 * 1. Fix Mermaid Pipes (handle `|`).
 * 2. Fix Mermaid Notes.
 * 3. Fix Malformed Arrows.
 * 4. Merge Double Labels.
 * 5. Fix Missing Brackets.
 */
export function deepDebugMermaid(content: string): string {
    // 1. Fix Mermaid Pipes (handle `|`) - Requested to be first
    let processed = fixMermaidPipes(content);

    // 2. Fix Mermaid Notes (move "note right of" to edge labels)
    processed = fixMermaidNotes(processed);

    // 3. Fix Malformed Arrows (handle `-->"` and `"-- `)
    processed = fixMalformedArrows(processed);

    // 4. Merge Double Labels
    processed = mergeDoubleLabels(processed);

    // 5. Fix Missing Brackets (existing logic)
    processed = fixMissingBrackets(processed);

    // 6. Fix Inline Subgraphs (convert subgraph "Label" end; to edge label)
    return fixInlineSubgraphs(processed);
}

/**
 * Fixes inline subgraphs used as edge labels.
 * Pattern: `NodeA --> NodeB; subgraph "Label" end;`
 * Result: `NodeA -- "Label" --> NodeB;`
 */
export function fixInlineSubgraphs(content: string): string {
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
        // Regex to detect: Node ... Arrow ... Node; subgraph "Label" end;
        // Captures:
        // 1. Source (lazy)
        // 2. Arrow (--> or ---)
        // 3. Target (lazy)
        // 4. Label (inside quotes)
        
        const regex = /^(.*?)\s*(---|-->)\s*(.*?);\s*subgraph\s+"(.*?)"\s*end;?\s*$/;
        const match = line.match(regex);
        
        if (match) {
            const source = match[1].trim();
            const arrow = match[2].trim(); // '-->' or '---'
            const target = match[3].trim();
            const label = match[4].trim();
            
            // Construct new line: source -- "label" --> target;
            // We use the arrow type to determine the connector.
            // --> becomes -- "label" -->
            // --- becomes -- "label" ---
            
            let newArrow = arrow;
            if (arrow === '-->') {
                newArrow = ` -- "${label}" --> `;
            } else if (arrow === '---') {
                newArrow = ` -- "${label}" --- `;
            } else {
                 // Fallback if regex matched something else (unlikely given regex)
                 newArrow = ` -- "${label}" ${arrow} `;
            }
            
            return `${source}${newArrow}${target};`;
        }
        return line;
    });
    return processedLines.join('\n');
}

/**
 * Merges double labels on a single edge.
 * Pattern: `-- "Label1" -->|"Label2"|`
 * Result: `-- "Label1<br>(Label2)" -->`
 * This relies on fixMermaidPipes having already standardized the pipe label to `|"..."|`.
 */
export function mergeDoubleLabels(content: string): string {
    // Regex to capture:
    // -- "Label1" --> |"Label2"|
    // We allow whitespace flexibility.
    
    return content.replace(/--\s*"([^"]*)"\s*-->\s*\|"([^"]*)"\|/g, (match, label1, label2) => {
        return `-- "${label1}<br>(${label2})" -->`;
    });
}

/**
 * Fixes Mermaid edge labels involving pipes `|`.
 * Ensures that labels are properly quoted and delimited.
 * 1. `-->|Text|` -> `-->|"Text"|`
 * 2. `-- Text |` -> `--|"Text"|`
 * 3. Handles complex cases like `-->|Fourier Transform|^2|` -> `|"Fourier Transform|^2"|` (quoting the content)
 */
export function fixMermaidPipes(content: string): string {
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
        // Skip lines without pipes or arrows
        if (!line.includes('|') || (!line.includes('-->') && !line.includes('--'))) {
            return line;
        }

        // 1. Protect Bracketed Content [...]
        const placeholders: string[] = [];
        let protectedLine = '';
        let depth = 0;
        let currentBlock = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '[') {
                if (depth === 0) protectedLine += '___BRACKET_BLOCK_' + placeholders.length + '___';
                depth++;
                currentBlock += char;
            } else if (char === ']') {
                depth--;
                currentBlock += char;
                if (depth === 0) {
                    placeholders.push(currentBlock);
                    currentBlock = '';
                }
            } else {
                if (depth > 0) currentBlock += char;
                else protectedLine += char;
            }
        }
        if (depth > 0) protectedLine += currentBlock;

        // 2. Fix Pipes in Protected Line
        // Regex: (Arrow)(Space)(Content Ending in Pipe)(Space)(NodeStart)
        // Content must NOT contain Arrow markers to prevent over-greediness.
        // NodeStart includes brackets, parens, quotes, or word chars.
        
        const arrowRegex = /((?:---|-->|--))(\s*)((?:(?!(?:---|-->|--)).)*\|)(\s*)(?=[a-zA-Z0-9_\[\(\{\"])/g;
        
        protectedLine = protectedLine.replace(arrowRegex, (match, arrow, space1, labelCandidate, space2) => {
            // labelCandidate is the text between arrow and Node, ending with `|`.
            
            let content = labelCandidate.trim();
            
            // Logic:
            // If it matches `|...|` (standard), extract inner.
            // If it matches `...|` (separator), extract all.
            // If it matches `|...|...|`, extract inner from first/last pipe?
            
            let inner = content;
            
            if (content.startsWith('|') && content.endsWith('|') && content.length > 1) {
                // Remove outer pipes
                inner = content.substring(1, content.length - 1);
            } else if (content.endsWith('|')) {
                // Remove trailing pipe
                inner = content.substring(0, content.length - 1).trim();
            }
            
            // Check if already quoted
            if (inner.startsWith('"') && inner.endsWith('"')) {
                return match;
            }
            
            // Quote it and wrap in pipes
            return `${arrow}${space1}|"${inner}"|${space2}`;
        });

        // 3. Restore Bracketed Content
        placeholders.forEach((block, index) => {
            protectedLine = protectedLine.replace('___BRACKET_BLOCK_' + index + '___', block);
        });

        return protectedLine;
    });

    return processedLines.join('\n');
}


/**
 * Fixes malformed arrow labels where the arrow syntax is absorbed into quotes.
 * Rule: Replace ` -->"` with `" -->` and `"-- ` with `--" `, unless inside `[...]`.
 * Example: `AbInitio -- "Provides Parameters For -->" MM` -> `AbInitio -- "Provides Parameters For" --> MM`
 */
export function fixMalformedArrows(content: string): string {
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
        // Simple check to avoid processing lines without arrow-like patterns
        if (!line.includes('--') && !line.includes('-->')) {
            return line;
        }

        // 1. Protect Bracketed Content [...]
        // We use a placeholder to hide content inside top-level brackets
        const placeholders: string[] = [];
        let protectedLine = '';
        let depth = 0;
        let currentBlock = '';
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '[') {
                if (depth === 0) {
                    protectedLine += '___BRACKET_BLOCK_' + placeholders.length + '___';
                }
                depth++;
                currentBlock += char;
            } else if (char === ']') {
                depth--;
                currentBlock += char;
                if (depth === 0) {
                    placeholders.push(currentBlock);
                    currentBlock = '';
                }
            } else {
                if (depth > 0) {
                    currentBlock += char;
                } else {
                    protectedLine += char;
                }
            }
        }
        // Handle unclosed brackets (append remaining)
        if (depth > 0) {
            protectedLine += currentBlock;
        }

        // 2. Perform Replacements on Protected Line
        // Fix A: ` -->"` -> `" -->`
        // We look for the pattern and replace it. 
        // Note: The user said "instances of ` -->"` ".
        // We assume this means literally space-dash-dash-gt-quote.
        protectedLine = protectedLine.replace(/ -->"/g, '" -->');

        // Fix B: `"-- ` -> `--" `
        // Quote-dash-dash-space
        protectedLine = protectedLine.replace(/"-- /g, '--" ');

        // 3. Restore Bracketed Content
        placeholders.forEach((block, index) => {
            protectedLine = protectedLine.replace('___BRACKET_BLOCK_' + index + '___', block);
        });

        return protectedLine;
    });

    return processedLines.join('\n');
}

/**
 * Internal function to fix missing brackets in Mermaid nodes.
 * Example: `... --> SpreadCalc价差计算 Spread Calculation;` -> `... --> SpreadCalc[价差计算 Spread Calculation];`
 */
export function fixMissingBrackets(content: string): string {
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
        // Skip if not in a mermaid block context or no arrows
        if (!line.includes('-->') && !line.includes('---') && !line.includes('--')) {
            return line;
        }

        // Regex to find:
        // 1. Arrow (including labeled arrows like -- "label" -->)
        // 2. ASCII NodeID ([a-zA-Z0-9_]+)
        // 3. Content that is NOT empty, has NO brackets, and ends at ;
        
        const regex = /((?:---|-->|--\s*"[^"]*"\s*-->)\s*)([a-zA-Z0-9_]+\b)([^\[\];\n]+)(;)/g;
        
        if (regex.test(line)) {
             return line.replace(regex, '$1$2[$3]$4');
        }
        
        return line;
    });
    return processedLines.join('\n');
}

/**
 * Converts "note right of Node: Text" lines into edge labels on the nearest preceding connection.
 * Requirements:
 * - Detect `note right of words: ...`
 * - Relocate sentence to nearest `words -->` block (Source) or `--> words` block (Target).
 * - Replace `-->` with `-- "Sentences" -->`.
 * - Remove the original note line.
 */
export function fixMermaidNotes(content: string): string {
    const lines = content.split('\n');
    const notesToProcess: { lineIndex: number; nodeId: string; text: string; }[] = [];

    // 1. Identify all notes
    // Regex allows "note right/left/top/bottom of Node: Text"
    const noteRegex = /^\s*note\s+(right|left|top|bottom)\s+of\s+([a-zA-Z0-9_]+)\s*:\s*(.*)$/i;

    lines.forEach((line, index) => {
        const match = line.match(noteRegex);
        if (match) {
            notesToProcess.push({
                lineIndex: index,
                nodeId: match[2],
                text: match[3].trim()
            });
        }
    });

    if (notesToProcess.length === 0) return content;

    const linesToDelete = new Set<number>();
    
    // Process notes
    for (const note of notesToProcess) {
        const { lineIndex, nodeId, text } = note;
        let found = false;

        // Search backwards from the note's position
        for (let j = lineIndex - 1; j >= 0; j--) {
            if (linesToDelete.has(j)) continue;

            const line = lines[j];
            
            // Check for Node as SOURCE (Outgoing)
            // Regex: Start or space(s) + NodeID + word boundary + optional brackets + space + (---|-->)
            const sourceRegex = new RegExp(`(?:^|\\s+)${nodeId}\\b(?:\\\[.*?\\\])?\\s*(---|-->)`);
            
            // Check for Node as TARGET (Incoming)
            // Regex: (---|-->) + space + NodeID + word boundary + optional brackets + (semicolon, end, or space)
            const targetRegex = new RegExp(`(---|-->)\\s*${nodeId}\\b(?:\\\[.*?\\\])?(?:;|$|\\s)`);

            // Apply replacement
            // Priority: Source (Outgoing) first, then Target (Incoming)
            
            if (sourceRegex.test(line)) {
                const escapedText = text.replace(/"/g, '\\"');
                lines[j] = line.replace(sourceRegex, (match) => {
                    return match.replace(/\s*(---|-->)$/, (fullMatch, arrow) => ` -- "${escapedText}" ${arrow}`);
                });
                found = true;
            } else if (targetRegex.test(line)) {
                const escapedText = text.replace(/"/g, '\\"');
                lines[j] = line.replace(targetRegex, (match) => {
                     return match.replace(/^(---|-->)/, (arrow) => `-- "${escapedText}" ${arrow}`);
                });
                found = true;
            }

            if (found) {
                linesToDelete.add(lineIndex);
                break; // Stop searching for this note
            }
        }
    }

    // Return joined lines, filtering out deleted ones
    return lines.filter((_, index) => !linesToDelete.has(index)).join('\n');
}
