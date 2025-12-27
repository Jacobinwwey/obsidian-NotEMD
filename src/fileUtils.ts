import { getSystemPrompt } from './promptUtils';
import { App, TFile, TFolder, Notice, Vault } from 'obsidian';
import NotemdPlugin from './main';
import { NotemdSettings, ProgressReporter } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { normalizeNameForFilePath, splitContent, getProviderForTask, getModelForTask, delay, createConcurrentProcessor, chunkArray, retry } from './utils'; // Added delay import
import { callDeepSeekAPI, callOpenAIApi, callAnthropicApi, callGoogleApi, callMistralApi, callAzureOpenAIApi, callLMStudioApi, callOllamaApi, callOpenRouterAPI } from './llmUtils';
import { refineMermaidBlocks, cleanupLatexDelimiters, deepDebugMermaid, checkMermaidErrors } from './mermaidProcessor'; // Assuming this will be moved or imported correctly later
import { _performResearch } from './searchUtils'; // Assuming this will be moved or imported correctly later
import { showDeletionConfirmationModal } from './ui/modals'; // Assuming this will be moved or imported correctly later
import mermaid from 'mermaid';

// --- Backlink and Note Management ---

export async function handleFileRename(app: App, oldPath: string, newPath: string) {
    const oldName = oldPath.split('/').pop()?.replace('.md', '') || '';
    const newName = newPath.split('/').pop()?.replace('.md', '') || '';

    if (!oldName || !newName || oldName === newName) return;

    new Notice(`Updating links for renamed file: ${newName}`, 5000);

    const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linkRegex = new RegExp(`\\[\\[${escapedOldName}\\]\\]`, 'g');

    const files = app.vault.getMarkdownFiles();
    let updatedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
        if (file.path === newPath) continue;
        try {
            let content = await app.vault.read(file);
            if (content.match(linkRegex)) {
                const updatedContent = content.replace(linkRegex, `[[${newName}]]`);
                if (content !== updatedContent) {
                    await app.vault.modify(file, updatedContent);
                    updatedCount++;
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMsg = `Error updating links in ${file.path} for rename: ${errorMessage}`;
            console.error(errorMsg, error); // Log original error object too
            errors.push(errorMsg);
        }
    }

    if (updatedCount > 0) {
        new Notice(`Updated links to "${newName}" in ${updatedCount} files.`, 5000);
    }
    if (errors.length > 0) {
        new Notice(`Encountered ${errors.length} errors while updating links. Please check the developer console for more details.`, 10000);
    }
}

export async function handleFileDelete(app: App, path: string) {
    const fileName = path.split('/').pop()?.replace('.md', '') || '';
    if (!fileName) return;

    new Notice(`Removing links for deleted file: ${fileName}`, 5000);

    const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linkRegex = new RegExp(`\\[\\[${escapedFileName}\\]\\]`, 'gi');

    const files = app.vault.getMarkdownFiles();
    let updatedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
        try {
            let content = await app.vault.read(file);
            let updatedContent = content;

            if (linkRegex.test(content)) {
                updatedContent = content.replace(linkRegex, '');
                updatedContent = updatedContent.replace(/^[ \t]*[-*+]\s*$/gm, ''); // Clean empty list items
                updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n').trim(); // Clean extra blank lines

                if (content !== updatedContent) {
                    await app.vault.modify(file, updatedContent);
                    updatedCount++;
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorMsg = `Error removing links from ${file.path} for delete: ${errorMessage}`;
            console.error(errorMsg, error); // Log original error object too
            errors.push(errorMsg);
        }
    }

    if (updatedCount > 0) {
        new Notice(`Removed links to "${fileName}" from ${updatedCount} files.`, 5000);
    }
    if (errors.length > 0) {
        new Notice(`Encountered ${errors.length} errors while removing links. Please check the developer console for more details.`, 10000);
    }
}

// --- Concept Note and Log File Generation ---

export async function createConceptNotes(
    app: App,
    settings: NotemdSettings,
    concepts: Set<string>,
    currentProcessingFileBasename: string | null,
    options?: { disableBacklink?: boolean; minimalTemplate?: boolean }
) {
    if (!settings.useCustomConceptNoteFolder || !settings.conceptNoteFolder) {
        return;
    }

    const folderPath = settings.conceptNoteFolder;
    const newlyCreatedConcepts: string[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    try {
        const targetFolder = app.vault.getAbstractFileByPath(folderPath);
        if (!targetFolder) {
            await app.vault.createFolder(folderPath);
        } else if (!(targetFolder instanceof TFolder)) {
            throw new Error(`Concept note output path '${folderPath}' exists but is not a folder.`);
        }

        for (const concept of concepts) {
            let safeName = normalizeNameForFilePath(concept);
            if (safeName.length > 100) safeName = safeName.substring(0, 100).trim();
            if (!safeName || /^\.+$/.test(safeName)) continue;

            const notePath = `${folderPath}/${safeName}.md`;
            const existingFile = app.vault.getAbstractFileByPath(notePath);

            try {
                if (existingFile instanceof TFile) {
                    // Add backlink only if not disabled
                    if (!options?.disableBacklink && currentProcessingFileBasename) {
                        let existingContent = await app.vault.read(existingFile);
                        const backlink = `[[${currentProcessingFileBasename}]]`;
                        const linkedFromHeader = `## Linked From`;
                        const backlinkLine = `- ${backlink}`;

                        if (!existingContent.includes(backlinkLine)) {
                            let newContent = existingContent.trim();
                            const headerIndex = newContent.indexOf(linkedFromHeader);
                            if (headerIndex !== -1) {
                                const nextHeaderIndex = newContent.indexOf('\n## ', headerIndex + 1);
                                const insertionPoint = (nextHeaderIndex !== -1) ? nextHeaderIndex : newContent.length;
                                newContent = newContent.substring(0, insertionPoint).trim() + `\n${backlinkLine}` + newContent.substring(insertionPoint).trim();
                            } else {
                                newContent += `\n\n${linkedFromHeader}\n${backlinkLine}`;
                            }
                            if (newContent.trim() !== existingContent.trim()) {
                                await app.vault.modify(existingFile, newContent.trim());
                                updatedCount++;
                            }
                        }
                    }
                } else if (!existingFile) {
                    let newNoteContent = `# ${concept}\n`;
                    // If minimal template is requested, do not add backlinks.
                    // Otherwise, add backlink if not disabled.
                    if (!options?.minimalTemplate && !options?.disableBacklink && currentProcessingFileBasename) {
                        newNoteContent += `\n## Linked From\n- [[${currentProcessingFileBasename}]]`;
                    }
                    await app.vault.create(notePath, newNoteContent.trim());
                    createdCount++;
                    newlyCreatedConcepts.push(concept);
                }
            } catch (fileOpError: unknown) { // Changed to unknown
                const errorMessage = fileOpError instanceof Error ? fileOpError.message : String(fileOpError);
                console.error(`Error processing concept note "${notePath}": ${errorMessage}`, fileOpError); // Log original error
            }
        }

        if (settings.generateConceptLogFile && newlyCreatedConcepts.length > 0) {
            await generateConceptLog(app, settings, newlyCreatedConcepts);
        }

    } catch (error: unknown) { // Changed to unknown
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error creating concept notes:", error);
        new Notice(`Error creating concept notes: ${errorMessage}. Please check the developer console for more details.`);
    }
}

async function generateConceptLog(app: App, settings: NotemdSettings, createdConcepts: string[]) {
    let logFolderPath = '';
    if (settings.useCustomConceptLogFolder && settings.conceptLogFolderPath) {
        logFolderPath = settings.conceptLogFolderPath;
    } else if (settings.useCustomConceptNoteFolder && settings.conceptNoteFolder) {
        logFolderPath = settings.conceptNoteFolder;
    }

    logFolderPath = logFolderPath.replace(/^\/|\/$/g, '');
    if (logFolderPath) logFolderPath += '/';

    const logFileName = (settings.useCustomConceptLogFileName && settings.conceptLogFileName)
        ? settings.conceptLogFileName
        : DEFAULT_SETTINGS.conceptLogFileName;
    const finalLogFileName = logFileName.toLowerCase().endsWith('.log') ? logFileName : `${logFileName}.log`;
    const logFilePath = `${logFolderPath}${finalLogFileName}`;

    let logContent = `generate ${createdConcepts.length} concepts md file\n`;
    createdConcepts.forEach((concept, index) => { logContent += `${index + 1}. ${concept}\n`; });

    try {
        const targetLogFolder = logFolderPath.replace(/\/$/, '');
        if (targetLogFolder && !app.vault.getAbstractFileByPath(targetLogFolder)) {
            await app.vault.createFolder(targetLogFolder);
        } else if (targetLogFolder && !(app.vault.getAbstractFileByPath(targetLogFolder) instanceof TFolder)) {
            new Notice(`Concept log output path '${targetLogFolder}' exists but is not a folder. Cannot create log file.`);
            return;
        }

        const existingLogFile = app.vault.getAbstractFileByPath(logFilePath);
        if (existingLogFile instanceof TFile) {
            await app.vault.modify(existingLogFile, logContent.trim());
            new Notice(`Overwrote concept log file: ${logFilePath}`);
        } else {
            await app.vault.create(logFilePath, logContent.trim());
            new Notice(`Created concept log file: ${logFilePath}`);
        }
    } catch (error: unknown) { // Changed to unknown
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error writing concept log file to ${logFilePath}:`, error);
        new Notice(`Error writing concept log file: ${errorMessage}. Please check the developer console for more details.`);
    }
}

// --- Duplicate Handling ---

// Simple duplicate word/phrase detection within the *current* content
export function findDuplicates(content: string): Set<string> {
    const duplicates = new Set<string>();
    const seenWords = new Set<string>();
    const lines = content.split('\n');

    lines.forEach(line => {
        const words = line.match(/[\p{L}\p{N}]+(?:['\-][\p{L}\p{N}]+)*/gu) || [];
        words.forEach(word => {
            const normalized = word.toLowerCase().replace(/'s$/, '');
            if (normalized.length > 2) {
                if (seenWords.has(normalized)) {
                    duplicates.add(normalized);
                }
                seenWords.add(normalized);
            }
        });
    });
    return duplicates;
}

// Placeholder for more advanced duplicate handling
export async function handleDuplicates(content: string, settings: NotemdSettings) {
    if (!settings.enableDuplicateDetection) {
        console.log("Duplicate detection is disabled in settings.");
        return;
    }
    // Implementation adapted from main.ts handleDuplicates
    // ... (rest of the duplicate detection logic) ...
    const potentialIssues = new Set<string>();
    const duplicateWords = findDuplicates(content);
    duplicateWords.forEach(word => potentialIssues.add(`Duplicate word: "${word}"`));
    // Add other checks (plural, normalization) here if needed

    if (potentialIssues.size > 0) {
        new Notice(`Found ${potentialIssues.size} potential duplicate/consistency issues in processed content. Check console.`);
        console.log('Potential duplicate/consistency issues found in content:', Array.from(potentialIssues));
    }
}

// Helper to get all unique words from content
function getAllWords(content: string): Set<string> {
    const words = new Set<string>();
    const lines = content.split('\n');
    lines.forEach(line => {
        const lineWords = line.match(/[\p{L}\p{N}]+(?:['\-][\p{L}\p{N}]+)*/gu) || [];
        lineWords.forEach(word => words.add(word));
    });
    return words;
}

// --- Main File Processing Logic ---

/**
 * Extracts concepts from a file using the LLM without modifying the file.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param file The TFile to process.
 * @param progressReporter Progress reporter instance.
 * @returns A promise that resolves to a Set of extracted concepts.
 */
export async function extractConceptsFromFile(
    app: App,
    plugin: NotemdPlugin,
    file: TFile,
    progressReporter: ProgressReporter
): Promise<Set<string>> {
    progressReporter.log(`Starting concept extraction for: ${file.name}`);
    const content = await app.vault.read(file);
    const allConcepts = new Set<string>();
    const settings = plugin.settings;

    // Determine provider and model
    const { provider, modelName } = plugin.getProviderAndModelForTask('extractConcepts');
    if (!provider) throw new Error('No valid LLM provider configured for "Extract Concepts" task.');

    const chunks = splitContent(content, settings);
    const totalChunks = chunks.length;
    progressReporter.log(`Splitting content into ${totalChunks} chunks for concept extraction.`);

    for (let i = 0; i < totalChunks; i++) {
        if (progressReporter.cancelled) {
            throw new Error("Concept extraction cancelled by user.");
        }

        const chunk = chunks[i];
        const chunkProgress = Math.floor(((i) / totalChunks) * 100);
        progressReporter.updateStatus(`Extracting concepts from chunk ${i + 1}/${totalChunks}...`, chunkProgress);
        progressReporter.log(`Processing chunk ${i + 1}/${totalChunks}...`);

        const prompt = getSystemPrompt(settings, 'extractConcepts');

        try {
            let responseText;
            // Using the same provider logic as processFile
            switch (provider.name) {
                case 'DeepSeek': responseText = await callDeepSeekAPI(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'OpenAI': responseText = await callOpenAIApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'Anthropic': responseText = await callAnthropicApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'Google': responseText = await callGoogleApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'Mistral': responseText = await callMistralApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'Azure OpenAI': responseText = await callAzureOpenAIApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'LMStudio': responseText = await callLMStudioApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'Ollama': responseText = await callOllamaApi(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                case 'OpenRouter': responseText = await callOpenRouterAPI(provider, modelName, prompt, chunk, progressReporter, settings, progressReporter.abortController?.signal); break;
                default: throw new Error(`Unsupported provider: ${provider.name}`);
            }

            // Parse the response to extract concepts
            const lines = responseText.split('\n');
            for (const line of lines) {
                if (line.startsWith('CONCEPT:')) {
                    const concept = line.substring('CONCEPT:'.length).trim();
                    if (concept) {
                        allConcepts.add(concept);
                    }
                }
            }
            progressReporter.log(`Chunk ${i + 1} processed, found ${allConcepts.size} unique concepts so far.`);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`LLM error on chunk ${i + 1} for ${file.name} during concept extraction:`, error);
            progressReporter.log(`Error extracting concepts from chunk ${i + 1}: ${errorMessage}`);
            // Continue to next chunk
        }
    }

    progressReporter.log(`Concept extraction finished for ${file.name}. Found a total of ${allConcepts.size} unique concepts.`);
    return allConcepts;
}


/**
 * Processes a single file: LLM call, link generation, duplicate check, post-processing, saving.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param file The TFile to process.
 * @param progressReporter Progress reporter instance.
 * @param currentProcessingFileBasename Ref object to hold the current file basename.
 */
export async function processFile(app: App, settings: NotemdSettings, file: TFile, progressReporter: ProgressReporter, currentProcessingFileBasename: { value: string | null }) {
    currentProcessingFileBasename.value = file.basename;
    progressReporter.log(`Starting processing for: ${file.name}`);
    const content = await app.vault.read(file);

    // Determine provider and model
    const provider = getProviderForTask('addLinks', settings);
    if (!provider) throw new Error('No valid LLM provider configured for "Add Links" task.');
    const modelName = getModelForTask('addLinks', provider, settings);

    // --- LLM Processing with Chunking ---
    const chunks = splitContent(content, settings); // Pass the full settings object
    let processedChunks: string[] = [];
    const totalChunks = chunks.length;
    progressReporter.log(`Splitting content into ${totalChunks} chunks.`);

    for (let i = 0; i < totalChunks; i++) {
        if (progressReporter.cancelled) {
            throw new Error("Processing cancelled by user during chunk processing.");
        }

        const chunk = chunks[i];
        const chunkProgress = Math.floor(((i) / totalChunks) * 100);
        progressReporter.updateStatus(`Processing chunk ${i + 1}/${totalChunks}...`, chunkProgress);
        progressReporter.log(`Processing chunk ${i + 1}/${totalChunks}...`);

        const prompt = getSystemPrompt(settings, 'addLinks');

        try {
            let responseText;
            switch (provider.name) {
                case 'DeepSeek': responseText = await callDeepSeekAPI(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'OpenAI': responseText = await callOpenAIApi(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'Anthropic': responseText = await callAnthropicApi(provider, modelName, prompt, chunk, progressReporter, settings); break; // Note: Anthropic might prefer prompt in user message, adjust call if needed
                case 'Google': responseText = await callGoogleApi(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'Mistral': responseText = await callMistralApi(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'Azure OpenAI': responseText = await callAzureOpenAIApi(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'LMStudio': responseText = await callLMStudioApi(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'Ollama': responseText = await callOllamaApi(provider, modelName, prompt, chunk, progressReporter, settings); break;
                case 'OpenRouter': responseText = await callOpenRouterAPI(provider, modelName, prompt, chunk, progressReporter, settings); break;
                default: throw new Error(`Unsupported provider: ${provider.name}`);
            }
            processedChunks.push(responseText);
            progressReporter.log(`Chunk ${i + 1} processed successfully.`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`LLM processing error on chunk ${i + 1} for ${file.name}:`, error);
            progressReporter.log(`Error processing chunk ${i + 1}: ${errorMessage}`);
            // Continue processing other files in the batch
            return;
        }
    } // End chunk loop

    if (progressReporter.cancelled) {
        progressReporter.log(`Processing cancelled for ${file.name} after LLM calls.`);
        return; // Exit if cancelled after loop
    }

    // Join chunks
    progressReporter.updateStatus('Merging processed chunks...', 90); // Update status before joining
    const processedContent = processedChunks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    // --- End LLM Processing with Chunking ---


    // --- Concept Extraction and Note Creation ---
    // Extract concepts from the LLM-processed content (which should contain [[links]])
    progressReporter.log(`Extracting concepts and creating notes for: ${file.name}...`);
    const concepts = new Set<string>();
    const linkRegex = /\[\[([^\[\]]+)\]\]/g; // Find [[links]]
    let match;
    const withLinks = processedContent; // Use the aggregated content

    while ((match = linkRegex.exec(withLinks)) !== null) {
        const concept = match[1].trim();
        // Basic filtering
        if (concept && concept.length > 1 && !/^\d+$/.test(concept)) {
            concepts.add(concept);
        }
    }

    // Create notes if setting is enabled and concepts were found
    if (settings.useCustomConceptNoteFolder && settings.conceptNoteFolder && concepts.size > 0) {
        progressReporter.log(`Found ${concepts.size} concepts. Creating/updating notes...`);
        try {
            // Pass the current file's basename for backlinking
            await createConceptNotes(app, settings, concepts, file.basename);
        } catch (conceptError: unknown) {
            const errorMsg = conceptError instanceof Error ? conceptError.message : String(conceptError);
            progressReporter.log(`⚠️ Error during concept note creation: ${errorMsg}`);
            // Don't stop the whole process, just log the warning
        }
    } else if (concepts.size > 0) {
        progressReporter.log(`Found ${concepts.size} concepts, but concept note creation is disabled or folder not set.`);
    } else {
        progressReporter.log(`No concepts found in LLM output to create notes for.`);
    }
    // --- End Concept Extraction ---


    // Duplicate Handling (Operates on the content with links)
    progressReporter.log(`Checking for duplicates in: ${file.name}...`);
    await handleDuplicates(withLinks, settings);
    if (progressReporter.cancelled) { progressReporter.log(`Processing cancelled for ${file.name} after duplicate check.`); return; }

    // Post-Processing (Mermaid/LaTeX)
    progressReporter.log(`Cleaning Mermaid/LaTeX for: ${file.name}`);
    let finalContent = withLinks;
    try {
        finalContent = cleanupLatexDelimiters(finalContent);
        finalContent = await refineMermaidBlocks(finalContent);
    } catch (cleanupError: unknown) { // Changed to unknown
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        progressReporter.log(`Warning: Error during Mermaid/LaTeX cleanup for ${file.name}: ${errorMessage}`);
    }
    if (progressReporter.cancelled) { progressReporter.log(`Processing cancelled for ${file.name} after post-processing.`); return; }

    // Remove \boxed{ wrapper
    const lines = finalContent.split('\n');
    if (lines.length > 0 && lines[0].trim() === '\\boxed{') {
        lines.shift();
        if (lines.length > 0 && lines[lines.length - 1].trim() === '}') lines.pop();
        finalContent = lines.join('\n');
    }
    if (progressReporter.cancelled) { progressReporter.log(`Processing cancelled for ${file.name} before saving.`); return; }

    // Conditionally remove all code fences if setting is enabled
    if (settings.removeCodeFencesOnAddLinks) {
        progressReporter.log(`Removing all code fences (\`\`\`markdown and \`\`\`)...`);
        // Remove ```markdown first, then remove any remaining ```
        finalContent = finalContent.replace(/```markdown/g, '');
        finalContent = finalContent.replace(/```/g, '');
    } else {
        // Original cleanup: Only remove ```markdown specifier, keep the fences
        progressReporter.log(`Removing only \`\`\`markdown specifiers...`);
        finalContent = finalContent.replace(/```markdown/g, ''); // Delete ```markdown 
    }

    // Determine Output Path & Save/Move
    await saveOrMoveProcessedFile(app, settings, file, finalContent, progressReporter);

    progressReporter.log(`Finished processing: ${file.name}`);
    currentProcessingFileBasename.value = null; // Clear after processing
}

/**
 * Handles saving or moving the processed file based on settings.
 */
async function saveOrMoveProcessedFile(app: App, settings: NotemdSettings, originalFile: TFile, processedContent: string, progressReporter: ProgressReporter) {
    let processedFileSaveDir = '';
    if (settings.useCustomProcessedFileFolder && settings.processedFileFolder) {
        processedFileSaveDir = settings.processedFileFolder;
    } else {
        processedFileSaveDir = originalFile.parent?.path || '';
    }
    processedFileSaveDir = processedFileSaveDir.replace(/^\/|\/$/g, '');
    if (processedFileSaveDir && !processedFileSaveDir.endsWith('/')) processedFileSaveDir += '/';
    if (originalFile.parent?.path === '/' && !(settings.useCustomProcessedFileFolder && settings.processedFileFolder)) processedFileSaveDir = '';

    const targetSaveFolder = processedFileSaveDir.replace(/\/$/, '');
    if (targetSaveFolder && !app.vault.getAbstractFileByPath(targetSaveFolder)) {
        try {
            await app.vault.createFolder(targetSaveFolder);
            progressReporter.log(`Created processed file output folder: ${targetSaveFolder}`);
        } catch (folderError: unknown) {
            const errorMessage = folderError instanceof Error ? folderError.message : String(folderError);
            const errorMsg = `Error creating processed file output folder ${targetSaveFolder}: ${errorMessage}. Please check folder permissions and path validity.`;
            progressReporter.log(errorMsg);
            new Notice(errorMsg, 10000);
            throw folderError instanceof Error ? folderError : new Error(errorMessage); // Re-throw
        }
    } else if (targetSaveFolder && !(app.vault.getAbstractFileByPath(targetSaveFolder) instanceof TFolder)) {
        const errorMsg = `Processed file output path '${targetSaveFolder}' exists but is not a folder.`;
        progressReporter.log(errorMsg);
        new Notice(errorMsg, 10000);
        throw new Error(errorMsg);
    }

    if (settings.moveOriginalFileOnProcess) {
        const targetPath = `${processedFileSaveDir}${originalFile.name}`;
        progressReporter.log(`Processing mode: Move & Overwrite original file.`);
        if (targetPath !== originalFile.path) {
            progressReporter.log(`Moving original file to: ${targetPath}`);
            const existingTargetFile = app.vault.getAbstractFileByPath(targetPath);
            if (existingTargetFile) throw new Error(`File already exists at target move path: ${targetPath}. Cannot move original file.`);
            await app.vault.rename(originalFile, targetPath);
            const movedFile = app.vault.getAbstractFileByPath(targetPath);
            if (movedFile instanceof TFile) { await app.vault.modify(movedFile, processedContent); progressReporter.log(`Overwrote content of moved file: ${targetPath}`); }
            else { throw new Error(`Failed to find moved file at ${targetPath} after rename.`); }
        } else {
            progressReporter.log(`Overwriting original file in place: ${originalFile.path}`);
            await app.vault.modify(originalFile, processedContent);
            progressReporter.log(`Overwrote original file: ${originalFile.path}`);
        }
    } else {
        let outputPath: string; let logAction: string;
        if (settings.useCustomAddLinksSuffix) {
            if (settings.addLinksCustomSuffix === '') {
                outputPath = originalFile.path; logAction = `Overwriting original file (custom setting): ${outputPath}`; progressReporter.log(`Processing mode: Overwrite original (custom setting).`);
            } else {
                let suffix = settings.addLinksCustomSuffix; if (suffix.toLowerCase().endsWith('.md')) suffix = suffix.substring(0, suffix.length - 3);
                outputPath = `${processedFileSaveDir}${originalFile.basename}${suffix}.md`; logAction = `Saving processed file with custom suffix: ${outputPath}`; progressReporter.log(`Processing mode: Create copy with custom suffix.`);
            }
        } else {
            outputPath = `${processedFileSaveDir}${originalFile.basename}_processed.md`; logAction = `Saving processed file with default suffix: ${outputPath}`; progressReporter.log(`Processing mode: Create/Overwrite default processed copy.`);
        }
        progressReporter.log(logAction);
        if (outputPath === originalFile.path) {
            const fileToModify = app.vault.getAbstractFileByPath(originalFile.path);
            if (fileToModify instanceof TFile) { await app.vault.modify(fileToModify, processedContent); progressReporter.log(`Overwrote original file: ${outputPath}`); }
            else { console.error(`Error: Tried to overwrite original file ${originalFile.path}, but it was not found.`); progressReporter.log(`Error: Could not find original file ${originalFile.path} to overwrite.`); }
        } else {
            const existingOutputFile = app.vault.getAbstractFileByPath(outputPath);
            if (existingOutputFile instanceof TFile) { await app.vault.modify(existingOutputFile, processedContent); progressReporter.log(`Overwrote existing file: ${outputPath}`); }
            else { await app.vault.create(outputPath, processedContent); progressReporter.log(`Created processed file: ${outputPath}`); }
        }
    }
}

/**
 * Generates content for a given note based on its title using an LLM.
 * Replaces the entire note content with the generated documentation.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param file The TFile object to process.
 * @param progressReporter Interface for reporting progress (Modal or Sidebar).
 */
export async function generateContentForTitle(app: App, settings: NotemdSettings, file: TFile, progressReporter: ProgressReporter) {
    const title = file.basename;
    const provider = getProviderForTask('generateTitle', settings);
    if (!provider) throw new Error('No valid LLM provider configured for "Generate from Title" task.');
    const modelName = getModelForTask('generateTitle', provider, settings);

    progressReporter.updateStatus(`Generating content for "${title}"...`, 5);
    progressReporter.log(`Starting content generation for: ${file.name}`);

    let researchContext = '';
    if (settings.enableResearchInGenerateContent) {
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user before research.");
        progressReporter.log(`Research enabled for "${title}". Performing web search...`);
        progressReporter.updateStatus(`Researching "${title}"...`, 10);
        try {
            // Assuming _performResearch is imported or available
            const context = await _performResearch(app, settings, title, progressReporter);
            if (progressReporter.cancelled) throw new Error("Processing cancelled by user during research.");
            if (context) {
                researchContext = context;
                progressReporter.log(`Research context obtained for "${title}".`);
                progressReporter.updateStatus(`Summarizing research for "${title}"...`, 15);
            } else {
                progressReporter.log(`Warning: Research for "${title}" returned no results or failed.`);
            }
        } catch (researchError: unknown) { // Changed to unknown
            const errorMessage = researchError instanceof Error ? researchError.message : String(researchError);
            if (errorMessage.includes("cancelled by user")) throw researchError; // Propagate cancellation
            progressReporter.log(`Error during research for "${title}": ${errorMessage}. Proceeding without web context.`);
        }
    } else {
        progressReporter.log(`Research disabled for "Generate from Title".`);
    }
    if (progressReporter.cancelled) throw new Error("Processing cancelled by user before generation prompt construction.");

    const researchContextSection = researchContext
        ? `Use the following research context to inform the documentation:\n\n${researchContext}\n\nDocumentation based on the title "${title}" and the provided context:`
        : `Documentation based *only* on the title "${title}":`;

    let generationPrompt = getSystemPrompt(
        settings,
        'generateTitle',
        {
            TITLE: title,
            RESEARCH_CONTEXT_SECTION: researchContextSection
        }
    );

    // Language-specific instruction
    const targetLanguageName = settings.availableLanguages.find(lang => lang.code === settings.language)?.name || settings.language;
    if (settings.language && settings.language !== 'en') {
        generationPrompt += `\n\nIMPORTANT: Process the request and perform all reasoning in English. However, the final output MUST be written in ${targetLanguageName}.In mermaid diagrams, it is necessary to translate into ${targetLanguageName} while retaining the English.`;
    }

    if (progressReporter.cancelled) throw new Error("Processing cancelled by user before API call.");
    progressReporter.log(`Calling ${provider.name} to generate content...`);
    const llmCallProgress = settings.enableResearchInGenerateContent ? 25 : 20;
    progressReporter.updateStatus(`Calling ${provider.name}...`, llmCallProgress);

    let generatedContent;
    try {
        switch (provider.name) {
            case 'DeepSeek': generatedContent = await callDeepSeekAPI(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            case 'OpenAI': generatedContent = await callOpenAIApi(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            case 'Anthropic': generatedContent = await callAnthropicApi(provider, modelName, '', generationPrompt, progressReporter, settings); break; // Prompt in content for Anthropic
            case 'Google': generatedContent = await callGoogleApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'Mistral': generatedContent = await callMistralApi(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            case 'Azure OpenAI': generatedContent = await callAzureOpenAIApi(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            case 'LMStudio': generatedContent = await callLMStudioApi(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            case 'Ollama': generatedContent = await callOllamaApi(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            case 'OpenRouter': generatedContent = await callOpenRouterAPI(provider, modelName, '', generationPrompt, progressReporter, settings); break;
            default: throw new Error(`Unsupported provider for content generation: ${provider.name}`);
        }
    } catch (error: unknown) { // Changed to unknown
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`LLM generation error for ${file.name}:`, error);
        progressReporter.log(`Error generating content for ${file.name}: ${errorMessage}`);
        throw error instanceof Error ? error : new Error(errorMessage); // Re-throw
    }

    if (progressReporter.cancelled) throw new Error("Processing cancelled by user after API call.");
    progressReporter.log(`Content received from ${provider.name}.`);
    progressReporter.updateStatus('Applying post-processing...', 80);

    let finalContent = generatedContent;
    try {
        finalContent = cleanupLatexDelimiters(finalContent);
        if (progressReporter.cancelled) throw new Error("Processing cancelled by user during post-processing.");
        finalContent = await refineMermaidBlocks(finalContent);
        progressReporter.log(`Mermaid/LaTeX cleanup applied.`);
    } catch (cleanupError: unknown) { // Changed to unknown
        const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        if (errorMessage.includes("cancelled by user")) throw cleanupError; // Propagate cancellation
        progressReporter.log(`Warning: Error during Mermaid/LaTeX cleanup: ${errorMessage}`);
    }
    if (progressReporter.cancelled) throw new Error("Processing cancelled by user after post-processing.");

    let contentToSave = finalContent.trim();
    const contentLines = contentToSave.split('\n');
    if (contentLines.length > 0 && contentLines[0].trim() === '\\boxed{') {
        contentLines.shift();
        if (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '}') contentLines.pop();
        contentToSave = contentLines.join('\n');
    }
    if (progressReporter.cancelled) throw new Error("Processing cancelled by user before saving.");

    progressReporter.log(`Replacing content in: ${file.name}`);
    progressReporter.updateStatus('Saving content...', 95);
    await app.vault.modify(file, contentToSave);
    progressReporter.log(`Content generated successfully for ${file.name}.`);
    progressReporter.updateStatus('Content generated successfully!', 100);
}

/**
 * Batch generates content for all Markdown files in a selected folder.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param folderPath Path of the folder to process.
 * @param progressReporter Interface for reporting progress.
 */
export async function batchGenerateContentForTitles(app: App, settings: NotemdSettings, folderPath: string, progressReporter: ProgressReporter) {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) throw new Error(`Selected path is not a valid folder: ${folderPath}`);

    let completeFolderName: string;
    if (settings.useCustomGenerateTitleOutputFolder) {
        completeFolderName = settings.generateTitleOutputFolderName || DEFAULT_SETTINGS.generateTitleOutputFolderName;
    } else {
        const baseFolderName = folderPath === '/' ? 'Vault' : folder.name;
        completeFolderName = `${baseFolderName}_complete`;
    }
    const parentPath = folder.parent?.path === '/' ? '' : (folder.parent?.path ? folder.parent.path + '/' : '');
    const completeFolderPath = `${parentPath}${completeFolderName}`;
    progressReporter.log(`Determined 'complete' folder path: ${completeFolderPath}`);

    const normalizedCompletePath = completeFolderPath === '' ? '' : (completeFolderPath.endsWith('/') ? completeFolderPath : completeFolderPath + '/');
    const filesToProcess = app.vault.getMarkdownFiles().filter(f => {
        const isInSelectedFolder = f.path.startsWith(folderPath === '/' ? '' : folderPath + '/');
        const isInCompleteFolder = normalizedCompletePath ? f.path.startsWith(normalizedCompletePath) : false;
        return isInSelectedFolder && !isInCompleteFolder && !f.name.endsWith('_processed.md');
    });

    if (filesToProcess.length === 0) {
        new Notice(`No eligible '.md' files found in "${folderPath}" (excluding '${completeFolderName}').`);
        progressReporter.log(`No eligible '.md' files found in "${folderPath}" (excluding '${completeFolderName}').`);
        progressReporter.updateStatus('No files found', 100);
        return { errors: [] }; // Return empty errors array
    }

    progressReporter.log(`Starting batch content generation for ${filesToProcess.length} files in "${folderPath}"...`);
    const errors: { file: string; message: string }[] = [];

    // Ensure Complete Folder Exists
    try {
        const normalizedCompleteFolderPath = completeFolderPath.endsWith('/') && completeFolderPath !== '/' ? completeFolderPath.slice(0, -1) : completeFolderPath;
        const targetFolderExists = await app.vault.adapter.exists(normalizedCompleteFolderPath);
        if (!targetFolderExists) { await app.vault.createFolder(normalizedCompleteFolderPath); progressReporter.log(`Created 'complete' folder: ${normalizedCompleteFolderPath}`); }
        else { const targetFolderStat = await app.vault.adapter.stat(normalizedCompleteFolderPath); if (targetFolderStat?.type !== 'folder') throw new Error(`Path for 'complete' folder (${normalizedCompleteFolderPath}) exists but is not a directory.`); }
    } catch (folderError: unknown) { // Changed to unknown
        const errorMessage = folderError instanceof Error ? folderError.message : String(folderError);
        new Notice(`Error ensuring 'complete' folder exists: ${errorMessage}`);
        progressReporter.log(`Error ensuring 'complete' folder exists at ${completeFolderPath}: ${errorMessage}`);
        throw folderError instanceof Error ? folderError : new Error(errorMessage); // Re-throw
    }

    if (!settings.enableBatchParallelism || settings.batchConcurrency <= 1) {
        // --- Serial Fallback (Existing Logic) ---
        for (let i = 0; i < filesToProcess.length; i++) {
            const file = filesToProcess[i];
            const progress = Math.floor(((i) / filesToProcess.length) * 100);
            progressReporter.updateStatus(`Generating ${i + 1}/${filesToProcess.length}: ${file.name}`, progress);
            if (progressReporter.cancelled) { progressReporter.log('Cancellation requested, stopping batch processing.'); break; }
            await delay(1); // Yield

            try {
                await generateContentForTitle(app, settings, file, progressReporter);
                await delay(1); // Yield

                // Move Successfully Processed File (existing logic)
                const normalizedCompletePathForMove = completeFolderPath ? (completeFolderPath.endsWith('/') ? completeFolderPath : completeFolderPath + '/') : '';
                const destinationPath = `${normalizedCompletePathForMove}${file.name}`;
                const destExists = await app.vault.adapter.exists(destinationPath);
                if (destExists) { progressReporter.log(`⚠️ File already exists at destination, skipping move: ${destinationPath}`); }
                else {
                    const sourceExists = await app.vault.adapter.exists(file.path);
                    if (sourceExists) {
                        if (progressReporter.cancelled) { progressReporter.log(`⚠️ Cancellation requested before moving ${file.name}. Skipping move.`); break; }
                        else { await app.vault.rename(file, destinationPath); progressReporter.log(`✅ Moved processed file to: ${destinationPath}`); }
                    } else { progressReporter.log(`⚠️ Source file ${file.path} not found, skipping move.`); }
                }
            } catch (fileError: unknown) {
                const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
                // ... error handling ...
                if (errorMessage.includes("cancelled by user")) { break; }
            }
            if (progressReporter.cancelled) { break; }
        }
        return { errors };
    }

    // --- Parallel Processing Logic ---
    const concurrency = Math.min(settings.batchConcurrency, 20); // Cap concurrency
    const processor = createConcurrentProcessor(concurrency, settings.apiCallIntervalMs, progressReporter);
    const fileBatches = chunkArray(filesToProcess, settings.batchSize);

    let allErrors: { file: string; message: string }[] = [];
    let processedCount = 0;

    for (let b = 0; b < fileBatches.length; b++) {
        const batch = fileBatches[b];
        progressReporter.log(`Processing batch ${b + 1}/${fileBatches.length} (${batch.length} files)`);
        if (progressReporter.cancelled) break;

        const tasks = batch.map(file => async () => {
            // Each task represents processing a single file
            const fileProgressReporter: ProgressReporter = { // Mini-reporter for individual file progress
                log: (msg: string) => progressReporter.log(`[${file.name}] ${msg}`),
                updateStatus: (msg: string, percentage?: number) => {
                    // Update overall batch progress, maybe combine with active tasks
                    if (percentage !== undefined) {
                        const overallProgress = Math.floor(((processedCount + (percentage / 100)) / filesToProcess.length) * 100);
                        progressReporter.updateStatus(`Batch: ${processedCount}/${filesToProcess.length} (${file.name}: ${msg})`, overallProgress);
                    } else {
                        progressReporter.updateStatus(`Batch: ${processedCount}/${filesToProcess.length} (${file.name}: ${msg})`);
                    }
                },
                cancelled: progressReporter.cancelled,
                requestCancel: () => progressReporter.requestCancel(),
                clearDisplay: () => { },
                abortController: progressReporter.abortController,
                activeTasks: progressReporter.activeTasks, // Pass through
                updateActiveTasks: (delta: number) => progressReporter.updateActiveTasks(delta), // Pass through
            };

            try {
                // generateContentForTitle already handles its own LLM calls and internal delays
                await generateContentForTitle(app, settings, file, fileProgressReporter);
                // Move/save immediately after LLM (still serial per result, but parallel LLM)
                // This part needs to be carefully managed to avoid race conditions on vault writes
                // For now, assume generateContentForTitle handles its own saving, or we need a separate serial queue for vault ops.
                // Given the current `generateContentForTitle` modifies the file directly (`app.vault.modify(file, contentToSave)`),
                // this is safe as Obsidian's vault operations are typically atomic per file.

                // Move Successfully Processed File (existing logic, adapted for parallel context)
                const normalizedCompletePathForMove = completeFolderPath ? (completeFolderPath.endsWith('/') ? completeFolderPath : completeFolderPath + '/') : '';
                const destinationPath = `${normalizedCompletePathForMove}${file.name}`;
                const destExists = await app.vault.adapter.exists(destinationPath);
                if (destExists) { fileProgressReporter.log(`⚠️ File already exists at destination, skipping move: ${destinationPath}`); }
                else {
                    const sourceExists = await app.vault.adapter.exists(file.path);
                    if (sourceExists) {
                        if (progressReporter.cancelled) { fileProgressReporter.log(`⚠️ Cancellation requested before moving ${file.name}. Skipping move.`); throw new Error("cancelled by user"); }
                        else { await app.vault.rename(file, destinationPath); fileProgressReporter.log(`✅ Moved processed file to: ${destinationPath}`); }
                    } else { fileProgressReporter.log(`⚠️ Source file ${file.path} not found, skipping move.`); }
                }

                return { file, success: true };
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                fileProgressReporter.log(`❌ Error processing ${file.name}: ${errorMessage}`);
                return { file, success: false, error: e };
            }
        });

        const results = await processor(tasks); // Execute batch in parallel
        processedCount += batch.length; // Update count for overall progress

        results.forEach(r => {
            const result = r as { success: boolean; file: TFile; error?: any };
            if (!result.success && result.error) {
                const error = result.error as { file?: TFile, message: string };
                allErrors.push({ file: error.file?.name || 'Unknown file', message: String(error.message) });
            }
        });

        if (progressReporter.cancelled) {
            progressReporter.log('Cancellation requested, stopping batch processing.');
            break;
        }

        // Delay between batches
        if (settings.batchInterDelayMs > 0 && b < fileBatches.length - 1) {
            progressReporter.log(`Delaying for ${settings.batchInterDelayMs}ms before next batch...`);
            await delay(settings.batchInterDelayMs);
        }
    }
    return { errors: allErrors };
}

/**
 * Fixes Mermaid and LaTeX syntax in a single file.
 * @param app Obsidian App instance.
 * @param file The TFile to process.
 * @param reporter The progress reporter.
 * @returns A promise that resolves to true if the file was modified, false otherwise.
 */
export async function fixMermaidSyntaxInFile(app: App, file: TFile, reporter: ProgressReporter): Promise<boolean> {
    const content = await app.vault.read(file);
    let fixed = cleanupLatexDelimiters(content);
    fixed = await refineMermaidBlocks(fixed);
    if (fixed.trim() !== content.trim()) {
        await app.vault.modify(file, fixed);
        reporter.log(`Fixed syntax in: ${file.name}`);
        return true;
    }
    return false;
}

/**
 * Batch fixes Mermaid and LaTeX syntax in Markdown files within a specified folder.
 * @param app Obsidian App instance.
 * @param settings The plugin settings.
 * @param folderPath Path of the folder to process.
 * @param progressReporter Interface for reporting progress.
 * @returns Object containing errors array and modifiedCount.
 */
export async function batchFixMermaidSyntaxInFolder(app: App, settings: NotemdSettings, folderPath: string, progressReporter: ProgressReporter): Promise<{ errors: { file: string; message: string }[], modifiedCount: number }> {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
        throw new Error(`Selected path is not a valid folder: ${folderPath}`);
    }

    const filesToProcess = app.vault.getMarkdownFiles().filter(f =>
        f.path.startsWith(folderPath === '/' ? '' : folderPath + '/')
    );

    if (filesToProcess.length === 0) {
        new Notice(`No '.md' files found in selected folder: ${folderPath}`);
        progressReporter.log(`No eligible files found in "${folderPath}".`);
        progressReporter.updateStatus('No files found', 100);
        return { errors: [], modifiedCount: 0 };
    }

    progressReporter.log(`Starting batch Mermaid/LaTeX fix for ${filesToProcess.length} files in "${folderPath}"...`);
    const errors: { file: string; message: string }[] = [];
    let modifiedCount = 0;
    const mermaidErrors: { filename: string; count: number }[] = [];

    // Ensure error folder exists if moving is enabled
    let errorMoveFolder = '';
    if (settings.moveMermaidErrorFiles && settings.mermaidErrorFolderPath) {
        errorMoveFolder = settings.mermaidErrorFolderPath.replace(/^\/|\/$/g, '');
        if (errorMoveFolder) {
            if (!app.vault.getAbstractFileByPath(errorMoveFolder)) {
                try {
                    await app.vault.createFolder(errorMoveFolder);
                    progressReporter.log(`Created Mermaid error folder: ${errorMoveFolder}`);
                } catch (e: any) {
                    progressReporter.log(`Error creating error folder: ${e.message}`);
                }
            }
        }
    }

    for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const progress = Math.floor(((i) / filesToProcess.length) * 100);
        progressReporter.updateStatus(`Checking ${i + 1}/${filesToProcess.length}: ${file.name}`, progress);

        if (progressReporter.cancelled) {
            progressReporter.log('Cancellation requested, stopping batch fix.');
            break;
        }
        await delay(1); // Yield

        try {
            // 1. Detect Errors (Read-only check)
            let content = await app.vault.read(file);
            let initialErrorCount = await checkMermaidErrors(content);

            if (initialErrorCount > 0) {
                progressReporter.log(`⚠️ ${initialErrorCount} Mermaid error(s) detected in ${file.name}. Applying fixes...`);

                // 2. Apply Standard Fix (Refine Mermaid Blocks)
                if (await fixMermaidSyntaxInFile(app, file, progressReporter)) {
                    modifiedCount++;
                    // Refresh content after fix
                    content = await app.vault.read(file);
                }

                // 3. Re-validate & Deep Debug if needed
                if (settings.enableMermaidErrorDetection) {
                    // Read content again (fixMermaidSyntaxInFile might have modified it)
                    let content = await app.vault.read(file);
                    let fileErrorCount = 0;
                    
                    // Helper to validate content using mermaid.parse
                    const validateContent = async (text: string) => {
                        let errors = 0;
                        const mermaidBlockRegex = /^(?:[ \t]*)(?:```|~~~)\s*mermaid\b[^\n]*\n([\s\S]*?)\n(?:[ \t]*)(?:```|~~~)/gim;
                        let match;
                        while ((match = mermaidBlockRegex.exec(text)) !== null) {
                            try {
                                await mermaid.parse(match[1]);
                            } catch (parseErr) {
                                errors++;
                            }
                        }
                        return errors;
                    };

                    fileErrorCount = await validateContent(content);

                    if (fileErrorCount > 0) {
                         progressReporter.log(`⚠️ Errors persist in ${file.name}. Attempting Deep Debug...`);
                         const deepDebugged = deepDebugMermaid(content);
                         
                         if (deepDebugged !== content) {
                             // Apply deep debug changes
                             await app.vault.modify(file, deepDebugged);
                             progressReporter.log(`Applied Deep Debug fixes to ${file.name}`);
                             
                             // Re-run standard fix (to handle the new brackets/quotes introduced by deep debug if any)
                             if (await fixMermaidSyntaxInFile(app, file, progressReporter)) {
                                 modifiedCount++;
                             }
                             
                             // Re-validate final state
                             content = await app.vault.read(file);
                             fileErrorCount = await validateContent(content);
                             
                             if (fileErrorCount === 0) {
                                 progressReporter.log(`✅ Deep Debug successfully resolved errors in ${file.name}`);
                             } else {
                                 progressReporter.log(`❌ Deep Debug reduced errors to ${fileErrorCount} in ${file.name}`);
                             }
                         }
                    }

                    if (fileErrorCount > 0) {
                        mermaidErrors.push({ filename: file.name, count: fileErrorCount });
                        // Move file if enabled
                        if (errorMoveFolder) {
                            const destPath = `${errorMoveFolder}/${file.name}`;
                            if (file.parent?.path !== errorMoveFolder) {
                                try {
                                    if (app.vault.getAbstractFileByPath(destPath)) {
                                        progressReporter.log(`⚠️ Destination ${destPath} exists. Skipping move for ${file.name}.`);
                                    } else {
                                        await app.vault.rename(file, destPath);
                                        progressReporter.log(`Moved error file to: ${destPath}`);
                                    }
                                } catch (moveErr: any) {
                                    progressReporter.log(`Error moving file ${file.name}: ${moveErr.message}`);
                                }
                            }
                        }
                    }
                }
            } else {
                progressReporter.log(`✅ No Mermaid errors detected in ${file.name}. Skipping.`);
            }

        } catch (fileError: unknown) {
            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
            const errorMsg = `Error fixing syntax in ${file.name}: ${errorMessage}`;
            console.error(errorMsg, fileError);
            progressReporter.log(`❌ ${errorMsg}`);
            errors.push({ file: file.name, message: errorMessage });
            // Log error silently
            const timestamp = new Date().toISOString();
            const errorDetails = fileError instanceof Error ? fileError.stack || fileError.message : String(fileError);
            const logEntry = `[${timestamp}] Error fixing syntax in ${file.path}:\nMessage: ${errorMessage}\nStack Trace:\n${errorDetails}\n\n`;
            try { await app.vault.adapter.append('error_syntax_fix.log', logEntry); }
            catch (logError: unknown) {
                 const logErrorMessage = logError instanceof Error ? logError.message : String(logError);
                 console.error("Failed to write to error_syntax_fix.log:", logError);
                 progressReporter.log(`⚠️ Failed to write error details to log file: ${logErrorMessage}`);
            }
            if (errorMessage.includes("cancelled by user")) { break; }
        }
        if (progressReporter.cancelled) { break; }
    }

    // Generate Error Report
    if (settings.enableMermaidErrorDetection && mermaidErrors.length > 0) {
        const folderName = folder.name === '/' ? 'Root' : folder.name;
        const reportFileName = `mermaid_error_${folderName}.md`;
        
        // Use triple newline to match the requested format's spacing
        const reportContent = mermaidErrors.map(e => `[[${e.filename}]]-[${e.count}]`).join('\n\n\n'); 
        
        try {
            const reportFile = app.vault.getAbstractFileByPath(reportFileName);
            if (reportFile instanceof TFile) {
                await app.vault.modify(reportFile, reportContent);
            } else {
                await app.vault.create(reportFileName, reportContent);
            }
            progressReporter.log(`Generated error report: ${reportFileName}`);
        } catch (reportErr: any) {
            progressReporter.log(`Error generating report file: ${reportErr.message}`);
        }
    }

    return { errors, modifiedCount }; // Return collected errors and count
}

/**
 * Saves the accumulated logs to an error log file in the vault root.
 * Also appends a suggestion to enable debug mode if disabled.
 */
export async function saveErrorLog(app: App, reporter: ProgressReporter, error: any, settings: NotemdSettings): Promise<void> {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Notemd_Error_Log_${timestamp}.txt`;
        
        let logContent = reporter.getLogs ? reporter.getLogs() : '';
        if (!logContent) {
            logContent = "No logs available from reporter.";
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';

        let fileContent = `Notemd Error Log - ${new Date().toLocaleString()}\n`;
        fileContent += `=================================================\n\n`;
        fileContent += `Error Message: ${errorMessage}\n`;
        if (errorStack) {
            fileContent += `Stack Trace:\n${errorStack}\n`;
        }
        fileContent += `\n=================================================\n`;
        fileContent += `Session Logs:\n\n${logContent}\n`;

        if (!settings.enableApiErrorDebugMode) {
            const suggestion = "\n[TIP] 'API Error Debugging Mode' is currently DISABLED. Enable it in Notemd settings -> Stable API calls to see detailed API error responses (status codes, raw text) in future logs.";
            fileContent += suggestion;
            reporter.log(suggestion); // Also show in UI
        } else {
             fileContent += "\n[INFO] 'API Error Debugging Mode' is ENABLED. Detailed API errors should be present in the logs above.";
        }

        await app.vault.create(filename, fileContent);
        reporter.log(`Error log saved to: ${filename}`);
        new Notice(`Error log saved: ${filename}`);

    } catch (saveError) {
        console.error("Failed to save error log:", saveError);
        reporter.log("Failed to save error log file. Check console.");
    }
}


/**
 * Checks for duplicate concept notes based on PowerShell script logic.
 * Reports potential duplicates and prompts the user for deletion confirmation.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param progressReporter Interface for reporting progress.
 */

/**
 * Saves the generated Mermaid summary content to a new file.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param originalFile The original TFile that was summarized.
 * @param mermaidContent The generated Mermaid diagram content.
 * @param progressReporter Progress reporter instance.
 * @returns The path of the newly created file.
 */
export async function saveMermaidSummaryFile(app: App, settings: NotemdSettings, originalFile: TFile, mermaidContent: string, progressReporter: ProgressReporter): Promise<string> {
    let saveDir = '';
    if (settings.useCustomSummarizeToMermaidSavePath && settings.summarizeToMermaidSavePath) {
        saveDir = settings.summarizeToMermaidSavePath;
    } else {
        saveDir = originalFile.parent?.path || '';
    }

    saveDir = saveDir.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
    if (saveDir && !saveDir.endsWith('/')) saveDir += '/'; // Ensure trailing slash if not empty

    const targetSaveFolder = saveDir.replace(/\/$/, ''); // Remove trailing slash for folder creation check
    if (targetSaveFolder && !app.vault.getAbstractFileByPath(targetSaveFolder)) {
        try {
            await app.vault.createFolder(targetSaveFolder);
            progressReporter.log(`Created Mermaid summary output folder: ${targetSaveFolder}`);
        } catch (folderError: unknown) {
            const errorMessage = folderError instanceof Error ? folderError.message : String(folderError);
            const errorMsg = `Error creating Mermaid summary output folder ${targetSaveFolder}: ${errorMessage}. Please check folder permissions and path validity.`;
            progressReporter.log(errorMsg);
            new Notice(errorMsg, 10000);
            throw folderError instanceof Error ? folderError : new Error(errorMessage); // Re-throw
        }
    } else if (targetSaveFolder && !(app.vault.getAbstractFileByPath(targetSaveFolder) instanceof TFolder)) {
        const errorMsg = `Mermaid summary output path '${targetSaveFolder}' exists but is not a folder.`;
        progressReporter.log(errorMsg);
        new Notice(errorMsg, 10000);
        throw new Error(errorMsg);
    }

    let suffix = settings.summarizeToMermaidCustomSuffix;
    if (!settings.useCustomSummarizeToMermaidSuffix || !suffix) {
        suffix = DEFAULT_SETTINGS.summarizeToMermaidCustomSuffix;
    }
    if (suffix.toLowerCase().endsWith('.md')) {
        suffix = suffix.substring(0, suffix.length - 3);
    }

    const outputFileName = `${originalFile.basename}${suffix}.md`;
    const outputPath = `${saveDir}${outputFileName}`;

    progressReporter.log(`Saving Mermaid summary to: ${outputPath}`);

    const existingOutputFile = app.vault.getAbstractFileByPath(outputPath);
    if (existingOutputFile instanceof TFile) {
        await app.vault.modify(existingOutputFile, mermaidContent);
        progressReporter.log(`Overwrote existing Mermaid summary file: ${outputPath}`);
    } else {
        await app.vault.create(outputPath, mermaidContent);
        progressReporter.log(`Created Mermaid summary file: ${outputPath}`);
    }
    return outputPath;
}

export async function checkAndRemoveDuplicateConceptNotes(app: App, settings: NotemdSettings, progressReporter: ProgressReporter) {

    if (!settings.useCustomConceptNoteFolder || !settings.conceptNoteFolder) {
        throw new Error("Concept Note Folder is not configured in settings. Cannot perform check.");
    }
    const conceptFolderPath = settings.conceptNoteFolder;
    const conceptFolder = app.vault.getAbstractFileByPath(conceptFolderPath);
    if (!conceptFolder || !(conceptFolder instanceof TFolder)) {
        throw new Error(`Concept Note Folder path "${conceptFolderPath}" is invalid or not a folder.`);
    }

    progressReporter.log(`Using Concept Note Folder: ${conceptFolderPath}`);
    progressReporter.updateStatus("Gathering files...", 10);
    const allMarkdownFiles = app.vault.getMarkdownFiles();
    const conceptNotes = allMarkdownFiles.filter(f => f.path.startsWith(conceptFolderPath + '/'));

    // --- Determine the scope for comparison based on refined settings ---
    let notesToCompareAgainst: TFile[]; // This will hold the files to check against
    const conceptFolderPrefix = conceptFolderPath === '/' ? '' : conceptFolderPath + '/'; // Handle root concept folder

    if (settings.duplicateCheckScopeMode === 'vault') {
        progressReporter.log(`Duplicate check mode: Comparing concept notes against 'Entire Vault' (excluding concept folder).`);
        notesToCompareAgainst = allMarkdownFiles.filter(f => !f.path.startsWith(conceptFolderPrefix));
    } else if (settings.duplicateCheckScopeMode === 'concept_folder_only') {
        progressReporter.log(`Duplicate check mode: Comparing concept notes against other notes within the 'Concept Folder Only'.`);
        // Compare concept notes against each other (excluding self-comparison later)
        notesToCompareAgainst = conceptNotes;
    } else { // 'include' or 'exclude' modes
        const paths = settings.duplicateCheckScopePaths
            .split('\n')
            .map(p => p.trim().replace(/^\/|\/$/g, '')) // Normalize each path
            .filter(p => p); // Remove empty lines

        if (paths.length === 0) {
            throw new Error(`Duplicate check scope mode is '${settings.duplicateCheckScopeMode}', but no paths were provided.`);
        }

        // Validate paths (basic check: ensure they exist and are folders)
        for (const p of paths) {
            const folder = app.vault.getAbstractFileByPath(p);
            if (!folder || !(folder instanceof TFolder)) {
                 throw new Error(`Invalid folder path specified in duplicate check scope: "${p}"`);
            }
            // Ensure scope paths are not the concept folder itself or inside it (still relevant for include/exclude)
             if (p === conceptFolderPath || p.startsWith(conceptFolderPrefix)) {
                 throw new Error(`Duplicate check scope path "${p}" cannot be the concept folder or inside it.`);
             }
        }

        const normalizedPaths = paths.map(p => p === '/' ? '' : p + '/'); // Add trailing slash for startsWith check, handle root

        if (settings.duplicateCheckScopeMode === 'include') {
            progressReporter.log(`Duplicate check mode: Comparing concept notes against 'Include Folders': ${paths.join(', ')}`);
            notesToCompareAgainst = allMarkdownFiles.filter(f =>
                !f.path.startsWith(conceptFolderPrefix) && // Exclude concept notes
                normalizedPaths.some(p => f.path.startsWith(p)) // Must be within one of the included paths
            );
        } else { // exclude mode
            progressReporter.log(`Duplicate check mode: Comparing concept notes against vault, 'Exclude Folders': ${paths.join(', ')}`);
            notesToCompareAgainst = allMarkdownFiles.filter(f =>
                !f.path.startsWith(conceptFolderPrefix) && // Exclude concept notes
                !normalizedPaths.some(p => f.path.startsWith(p)) // Must NOT be within any of the excluded paths
            );
        }
    }
    // --- End scope determination ---

    if (conceptNotes.length === 0) throw new Error("No concept notes found in the specified folder.");
    progressReporter.log(`Found ${conceptNotes.length} concept notes to check.`);
    progressReporter.log(`Comparing against ${notesToCompareAgainst.length} notes in the defined scope.`);
    const filesToReport = new Map<string, { reason: string; counterparts: string[] }>();
    const allFilesMap = new Map(allMarkdownFiles.map(f => [f.path, f])); // For easy lookup by path

    // ** 1. Exact Filename Matching **
    progressReporter.updateStatus("Checking exact filename matches...", 20);
    const filenameMap = new Map<string, string[]>(); // Map basename -> list of full paths
    // Build map using only the files within the comparison scope
    notesToCompareAgainst.forEach(file => {
        const basenameLower = file.basename.toLowerCase();
        const list = filenameMap.get(basenameLower) || [];
        list.push(file.path);
        filenameMap.set(basenameLower, list);
    });
    // Also add concept notes themselves to the map if checking within concept folder
    if (settings.duplicateCheckScopeMode === 'concept_folder_only') {
        conceptNotes.forEach(file => {
            const basenameLower = file.basename.toLowerCase();
            const list = filenameMap.get(basenameLower) || [];
            if (!list.includes(file.path)) { // Avoid adding self twice
                 list.push(file.path);
                 filenameMap.set(basenameLower, list);
            }
        });
    }

    conceptNotes.forEach(cn => {
        const basenameLower = cn.basename.toLowerCase();
        const matches = filenameMap.get(basenameLower) || [];
        // Find counterparts *within the comparison scope* that are not the concept note itself
        const counterparts = matches.filter(path => path !== cn.path);
        if (counterparts.length > 0 && !filesToReport.has(cn.path)) {
            filesToReport.set(cn.path, { reason: "Exact Match", counterparts: counterparts });
            progressReporter.log(`[Exact Match] ${cn.path} matches ${counterparts.join(', ')}`);
        }
    });

    // ** 2. Plural Handling **
    progressReporter.updateStatus("Checking plural variants...", 40);
    const comparisonBasenamesLower = new Set(notesToCompareAgainst.map(f => f.basename.toLowerCase()));
    // If checking within concept folder, add those basenames too
     if (settings.duplicateCheckScopeMode === 'concept_folder_only') {
         conceptNotes.forEach(cn => comparisonBasenamesLower.add(cn.basename.toLowerCase()));
     }

    conceptNotes.forEach(cn => {
        if (filesToReport.has(cn.path)) return; // Skip already marked
        const nameLower = cn.basename.toLowerCase();
        let singular = '';
        if (nameLower.endsWith('ies') && nameLower.length > 3) singular = nameLower.substring(0, nameLower.length - 3) + 'y';
        else if (nameLower.endsWith('es') && nameLower.length > 2) singular = nameLower.substring(0, nameLower.length - 2);
        else if (nameLower.endsWith('s') && nameLower.length > 1) singular = nameLower.substring(0, nameLower.length - 1);

        if (singular && comparisonBasenamesLower.has(singular)) {
            // Find all files in the comparison scope (including concept notes if mode is concept_folder_only) that match the singular form
            const counterparts = notesToCompareAgainst
                 .concat(settings.duplicateCheckScopeMode === 'concept_folder_only' ? conceptNotes : [])
                 .filter(f => f.basename.toLowerCase() === singular && f.path !== cn.path) // Exclude self
                 .map(f => f.path);

            if (counterparts.length > 0 && !filesToReport.has(cn.path)) {
                filesToReport.set(cn.path, { reason: `Plural of "${singular}"`, counterparts: counterparts });
                progressReporter.log(`[Plural Match] ${cn.path} is plural of ${counterparts.join(', ')}`);
            }
        }
    });

    // ** 3. Symbol Normalization Check **
    progressReporter.updateStatus("Checking normalized names...", 60);
    const normalizedMap = new Map<string, string[]>(); // Map normalized name -> list of full paths
    // Build map using only files in comparison scope
    notesToCompareAgainst.forEach(file => {
        const normalized = file.basename.toLowerCase().replace(/[-_]/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
        if (normalized) {
            const list = normalizedMap.get(normalized) || [];
            list.push(file.path);
            normalizedMap.set(normalized, list);
        }
    });
     // Also add concept notes themselves to the map if checking within concept folder
     if (settings.duplicateCheckScopeMode === 'concept_folder_only') {
         conceptNotes.forEach(file => {
             const normalized = file.basename.toLowerCase().replace(/[-_]/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
             if (normalized) {
                 const list = normalizedMap.get(normalized) || [];
                 if (!list.includes(file.path)) { // Avoid adding self twice
                     list.push(file.path);
                     normalizedMap.set(normalized, list);
                 }
             }
         });
     }

    conceptNotes.forEach(cn => {
        if (filesToReport.has(cn.path)) return; // Skip already marked
        const normalized = cn.basename.toLowerCase().replace(/[-_]/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
        if (normalized) {
            const matches = normalizedMap.get(normalized) || [];
            // Find counterparts *within the comparison scope* that are not the concept note itself
            const counterparts = matches.filter(path => path !== cn.path);
            if (counterparts.length > 0 && !filesToReport.has(cn.path)) {
                const counterpartNames = counterparts.map(p => allFilesMap.get(p)?.basename || p); // Use allFilesMap for display names
                filesToReport.set(cn.path, { reason: `Normalized Match (to "${normalized}")`, counterparts: counterpartNames });
                progressReporter.log(`[Normalized Match] ${cn.path} matches ${counterpartNames.join(', ')}`);
            }
        }
    });

    // ** 4. Single-Word Containment Check **
    // This check only makes sense when comparing against notes *outside* the concept folder.
    if (settings.duplicateCheckScopeMode !== 'concept_folder_only') {
        progressReporter.updateStatus("Checking single-word containment...", 80);
        conceptNotes.forEach(cn => {
            if (filesToReport.has(cn.path)) return; // Skip already marked
            const words = cn.basename.split(/\s+/);
            if (words.length === 1) {
                const singleWordLower = words[0].toLowerCase();
                // Compare against notesToCompareAgainst (which already excludes concept notes in vault/include/exclude modes)
                const counterparts = notesToCompareAgainst
                    .filter(on => on.basename.toLowerCase().split(/\s+/).includes(singleWordLower) && on.basename.includes(' ')) // Ensure counterpart is multi-word
                    .map(f => f.path);

                if (counterparts.length > 0 && !filesToReport.has(cn.path)) {
                    const counterpartNames = counterparts.map(p => allFilesMap.get(p)?.basename || p);
                    filesToReport.set(cn.path, { reason: `Contained in Multi-Word Note`, counterparts: counterpartNames });
                    progressReporter.log(`[Containment] ${cn.path} contained in ${counterpartNames.join(', ')}`);
                }
            }
        });
    } else {
         progressReporter.log(`Skipping single-word containment check (mode: 'Concept Folder Only').`);
    }

    // --- Report Results & Confirm Deletion ---
    progressReporter.updateStatus("Reporting results...", 95);
    if (filesToReport.size > 0) {
        const reportList = Array.from(filesToReport.entries()).map(([path, details]) => ({ path, reason: details.reason, counterparts: details.counterparts }));
        progressReporter.log(`--- Potential Duplicate Concept Notes Found (${filesToReport.size}) ---`);
        reportList.forEach(item => { progressReporter.log(`- ${item.path} (Reason: ${item.reason}, Conflicts: ${item.counterparts.join(', ') || 'N/A'})`); });
        progressReporter.log(`--------------------------------------------------`);
        progressReporter.log("Review the list above.");

        // Assuming showDeletionConfirmationModal is imported from ui/modals.ts
        const shouldDelete = await showDeletionConfirmationModal(app, reportList);

        if (shouldDelete) {
            progressReporter.log("User confirmed deletion. Proceeding...");
            const totalToDelete = reportList.length;
            progressReporter.updateStatus(`Deleting ${totalToDelete} files...`, 0);
            let deletedCount = 0; let deletionErrors = 0;
            for (let i = 0; i < reportList.length; i++) {
                const item = reportList[i];
                const progressPercent = Math.floor(((i + 1) / totalToDelete) * 100);
                progressReporter.updateStatus(`Deleting ${i + 1}/${totalToDelete}: ${item.path}`, progressPercent);
                await delay(10); // Yield
                try {
                    const fileToDelete = app.vault.getAbstractFileByPath(item.path);
                    if (fileToDelete instanceof TFile) { await app.vault.trash(fileToDelete, true); progressReporter.log(`[DELETED] ${item.path}`); deletedCount++; }
                    else { progressReporter.log(`[SKIP] File not found or not a file: ${item.path}`); }
                } catch (deleteError: unknown) { // Changed to unknown
                    const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
                    progressReporter.log(`[ERROR] Failed to delete ${item.path}: ${errorMessage}`);
                    deletionErrors++;
                }
            }
            const finalMessage = `Deletion complete. Deleted ${deletedCount} of ${reportList.length} identified files. Encountered ${deletionErrors} errors.`;
            progressReporter.log(finalMessage); new Notice(finalMessage); progressReporter.updateStatus(finalMessage, 100);
        } else {
            progressReporter.log("Deletion cancelled by user."); new Notice("Duplicate deletion cancelled."); progressReporter.updateStatus("Duplicate check complete (deletion cancelled).", 100);
        }
    } else {
        progressReporter.log("No potential duplicate concept notes found."); new Notice("No potential duplicate concept notes found."); progressReporter.updateStatus("Duplicate check complete.", 100);
    }
}
