import { App, TFile, TFolder, Notice, Vault } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { normalizeNameForFilePath, splitContent, getProviderForTask, getModelForTask, delay } from './utils'; // Added delay import
import { getLLMProcessingPrompt, callDeepSeekAPI, callOpenAIApi, callAnthropicApi, callGoogleApi, callMistralApi, callAzureOpenAIApi, callLMStudioApi, callOllamaApi, callOpenRouterAPI } from './llmUtils';
import { refineMermaidBlocks, cleanupLatexDelimiters } from './mermaidProcessor'; // Assuming this will be moved or imported correctly later
import { _performResearch } from './searchUtils'; // Assuming this will be moved or imported correctly later
import { showDeletionConfirmationModal } from './ui/modals'; // Assuming this will be moved or imported correctly later

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
        new Notice(`Encountered ${errors.length} errors while updating links. Check console.`, 10000);
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
        new Notice(`Encountered ${errors.length} errors while removing links. Check console.`, 10000);
    }
}

// --- Concept Note and Log File Generation ---

export async function createConceptNotes(app: App, settings: NotemdSettings, concepts: Set<string>, currentProcessingFileBasename: string | null) {
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
                    if (currentProcessingFileBasename) {
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
        new Notice(`Error creating concept notes: ${errorMessage}. Check console.`);
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
        new Notice(`Error writing concept log file: ${errorMessage}`);
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

    // LLM Processing
    progressReporter.log(`Submitting content to LLM (${provider.name}/${modelName}) for: ${file.name}...`);
    const prompt = getLLMProcessingPrompt();
    let processedContent;
    try {
        switch (provider.name) {
            case 'DeepSeek': processedContent = await callDeepSeekAPI(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'OpenAI': processedContent = await callOpenAIApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'Anthropic': processedContent = await callAnthropicApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'Google': processedContent = await callGoogleApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'Mistral': processedContent = await callMistralApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'Azure OpenAI': processedContent = await callAzureOpenAIApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'LMStudio': processedContent = await callLMStudioApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'Ollama': processedContent = await callOllamaApi(provider, modelName, prompt, content, progressReporter, settings); break;
            case 'OpenRouter': processedContent = await callOpenRouterAPI(provider, modelName, prompt, content, progressReporter, settings); break;
            default: throw new Error(`Unsupported provider: ${provider.name}`);
        }
    } catch (error: unknown) { // Changed to unknown
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`LLM processing error for ${file.name}:`, error);
        progressReporter.log(`Error processing chunk for ${file.name}: ${errorMessage}`);
        // Re-throw the original error if it's an Error instance, otherwise wrap it
        throw error instanceof Error ? error : new Error(errorMessage);
    }

    if (progressReporter.cancelled) { progressReporter.log(`Processing cancelled for ${file.name} after LLM call.`); return; }

    // Link Generation (Placeholder - LLM is expected to add links)
    progressReporter.log(`Generating Obsidian links for: ${file.name}...`);
    const withLinks = processedContent; // Assume LLM added links

    // Duplicate Handling
    progressReporter.log(`Checking for duplicates in: ${file.name}...`);
    await handleDuplicates(withLinks, settings);
    if (progressReporter.cancelled) { progressReporter.log(`Processing cancelled for ${file.name} after duplicate check.`); return; }

    // Post-Processing (Mermaid/LaTeX)
    progressReporter.log(`Cleaning Mermaid/LaTeX for: ${file.name}`);
    let finalContent = withLinks;
    try {
        finalContent = cleanupLatexDelimiters(finalContent);
        finalContent = refineMermaidBlocks(finalContent);
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
        try { await app.vault.createFolder(targetSaveFolder); progressReporter.log(`Created processed file output folder: ${targetSaveFolder}`); }
        catch (folderError: unknown) { // Changed to unknown
             const errorMessage = folderError instanceof Error ? folderError.message : String(folderError);
             progressReporter.log(`Error creating processed file output folder ${targetSaveFolder}: ${errorMessage}`);
             throw folderError instanceof Error ? folderError : new Error(errorMessage); // Re-throw
        }
    } else if (targetSaveFolder && !(app.vault.getAbstractFileByPath(targetSaveFolder) instanceof TFolder)) {
        const errorMsg = `Processed file output path '${targetSaveFolder}' exists but is not a folder.`; progressReporter.log(errorMsg); throw new Error(errorMsg);
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

    let generationPrompt = `Create comprehensive technical documentation about "${title}" with a focus on scientific and mathematical rigor.`;
    if (researchContext) { generationPrompt += `\n\nUse the following research context to inform the documentation:\n\n${researchContext}\n\nDocumentation based on the title "${title}" and the provided context:`; }
    else { generationPrompt += `\n\nDocumentation based *only* on the title "${title}":`; }
    // Add the detailed instructions (common part) - Restored from main_origin.ts
    generationPrompt += `

Include:
1.  Detailed explanation of core concepts with their mathematical foundations. Start with a Level 2 Header (## ${title}).
2.  Key technical specifications with precise values and units (use tables).
3.  Common use cases with quantitative performance metrics.
4.  Implementation considerations with algorithmic complexity analysis (if applicable).
5.  Performance characteristics with statistical measures.
6.  Related technologies with comparative mathematical models.
7.  Mathematical equations in LaTeX format (using $$...$$ for display and $...$ for inline) with detailed explanations of all parameters and variables. Example: $$ P(f) = \\int_{-\\infty}^{\\infty} p(t) e^{-i2\\pi ft} dt $$
8.  Mermaid.js diagram code blocks using the format \`\`\`mermaid ... \`\`\` (IMPORTANT: without brackets "()" or "{}" for Mermaid diagrams) for complex relationships or system architectures,Enclosed node names with spaces/special characters in square brackets,which is [ and ], Avoids special LaTeX syntax and Added quotes around subgraph titles with special characters, "subgraph" and "end" cannot appear on the same line!For example:
\`\`\`mermaid
graph TD
    Start[Input: Year] --> IsDiv400["Year % 400 == 0?"];
    IsDiv400 -- Yes --> Leap[Leap Year, 366 days];
    IsDiv400 -- No --> IsDiv100["Year % 100 == 0?"];
    IsDiv100 -- Yes --> Common1[Common Year, 365 days];
    IsDiv100 -- No --> IsDiv4["Year % 4 == 0?"];
    IsDiv4 -- Yes --> Leap;
    IsDiv4 -- No --> Common2[Common Year, 365 days];
    Leap --> End[End];
    Common1 --> End;
    Common2 --> End;

    style Leap fill:#ccffcc,stroke:#006600
    style Common1 fill:#ffcccc,stroke:#990000
    style Common2 fill:#ffcccc,stroke:#990000
\`\`\` and \`\`\`mermaid
graph LR
    subgraph "Material Mechanical Properties"
        Stress --> Strain;
        Strain -- "Linear Ratio" --> Youngs_Modulus[E - Young's Modulus<br>Tensile Stiffness];
        Stress -- "Yield Point" --> Yield_Strength[σy - Yield Strength<br>Onset of Plasticity];
        Stress -- "Maximum Point" --> UTS[UTS - Ultimate Tensile Strength];
        Strain -- "Transverse/Axial Ratio" --> Poissons_Ratio[ν - Poisson's Ratio];
        Shear_Stress --> Shear_Strain;
        Shear_Strain -- "Linear Ratio" --> Shear_Modulus[G - Shear Modulus<br>Shear Stiffness];
        Hydrostatic_Pressure --> Volumetric_Strain;
        Volumetric_Strain -- "Linear Ratio" --> Bulk_Modulus[K - Bulk Modulus<br>Volumetric Stiffness];

        Youngs_Modulus -- "Isotropic Relations" --> Shear_Modulus;
        Youngs_Modulus -- "Isotropic Relations" --> Bulk_Modulus;
        Youngs_Modulus -- "Isotropic Relations" --> Poissons_Ratio;
        Shear_Modulus -- "Isotropic Relations" --> Bulk_Modulus;
        Shear_Modulus -- "Isotropic Relations" --> Poissons_Ratio;
        Bulk_Modulus -- "Isotropic Relations" --> Poissons_Ratio;

        Yield_Strength --> Plasticity[Plastic Deformation Region];
        UTS --> Plasticity;
        Stress_Strain_Curve_Area --> Toughness;

    end

    style Youngs_Modulus fill:#ccf,stroke:#333,stroke-width:2px
    style Shear_Modulus fill:#cfc,stroke:#333,stroke-width:2px
    style Bulk_Modulus fill:#cff,stroke:#333,stroke-width:2px
    style Poissons_Ratio fill:#fcf,stroke:#333,stroke-width:2px
\`\`\` and 
\`\`\`mermaid
graph TD
    WavePattern -->|Mechanical?| Mechanical
    WavePattern -->|Electromagnetic?| Electromagnetic
    Mechanical -->|Longitudinal?| Sound
    Mechanical -->|Transverse?| SeismicWaves
    Sound[Sound Waves] -->|In air?| Acoustic[343 m/s, 20 Hz-20 kHz]
    SeismicWaves[Seismic Waves] -->|Body wave?| PWave[6.5 km/s]
    SeismicWaves -->|Surface wave?| RayleighWave[2.5 km/s]

    Electromagnetic -->|Free space?| EMFreeSpace[c=3e8 m/s]
    Electromagnetic -->|Guided medium?| OpticalFiber[Dispersion=1e-3 ps/nm/km]
\`\`\` and \`\`\`mermaid
graph TD
    subgraph "Theoretical Frameworks for Electromagnetism"
        QED["Standard Model QED Massless Photon"]
        Proca["Proca Theory Massive Photon - 'Yukawa Photon'"]
        Stueckelberg["Stueckelberg Mechanism Massive Photon"]
        DarkPhoton["Dark Photon Models New Gauge Boson"]
    end

    QED -- "Add Mass Term" --> Proca;
    Proca -- "Breaks Gauge Invariance" --> Issue1["Renormalization/High Energy Issues"];
    QED -- "Introduce Stueckelberg Field" --> Stueckelberg;
    Stueckelberg -- "Preserves Gauge Invariance" --> Proca_Unitary["Unitary Gauge -> Proca"];
    Stueckelberg -- "Theoretically Cleaner" --> Benefit1["Better Renormalizability"];
    QED -- "Add New U1' + Mixing" --> DarkPhoton;

    Proca -- "Feature: Yukawa Potential" --> YP["Vr ~ exp-mr/r"];
    QED -- "Feature: Coulomb Potential" --> CP["Vr ~ 1/r"];
    Proca -- "Feature: 3 d.o.f." --> DOF3["2 Transverse + 1 Longitudinal"];
    QED -- "Feature: 2 d.o.f." --> DOF2["2 Transverse"];

    style QED fill:#ccf,stroke:#333,stroke-width:2px
    style Proca fill:#fcc,stroke:#333,stroke-width:2px
    style Stueckelberg fill:#cfc,stroke:#333,stroke-width:2px
    style DarkPhoton fill:#ffc,stroke:#333,stroke-width:2px
\`\`\`.
9.  Use bullet points for lists longer than 3 items.
10. Include references to academic papers with DOI where applicable, under a "## References" section.
11. Preserve all mathematical formulas and scientific principles without simplification.
12. Define all variables and parameters used in equations.
13. Include statistical measures and confidence intervals where relevant.

Format directly for Obsidian markdown. Do NOT wrap the entire response in a markdown code block. Start directly with the Level 2 Header.`;

    if (progressReporter.cancelled) throw new Error("Processing cancelled by user before API call.");
    progressReporter.log(`Calling ${provider.name} to generate content...`);
    const llmCallProgress = settings.enableResearchInGenerateContent ? 25 : 20;
    progressReporter.updateStatus(`Calling ${provider.name}...`, llmCallProgress);

    let generatedContent;
    try {
        switch (provider.name) {
            case 'DeepSeek': generatedContent = await callDeepSeekAPI(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'OpenAI': generatedContent = await callOpenAIApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'Anthropic': generatedContent = await callAnthropicApi(provider, modelName, '', generationPrompt, progressReporter, settings); break; // Prompt in content for Anthropic
            case 'Google': generatedContent = await callGoogleApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'Mistral': generatedContent = await callMistralApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'Azure OpenAI': generatedContent = await callAzureOpenAIApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'LMStudio': generatedContent = await callLMStudioApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'Ollama': generatedContent = await callOllamaApi(provider, modelName, generationPrompt, '', progressReporter, settings); break;
            case 'OpenRouter': generatedContent = await callOpenRouterAPI(provider, modelName, generationPrompt, '', progressReporter, settings); break;
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
        finalContent = refineMermaidBlocks(finalContent);
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

    for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const progress = Math.floor(((i) / filesToProcess.length) * 100);
        progressReporter.updateStatus(`Generating ${i + 1}/${filesToProcess.length}: ${file.name}`, progress);

        if (progressReporter.cancelled) { progressReporter.log('Cancellation requested, stopping batch processing.'); break; }
        await delay(1); // Yield

        try {
            await generateContentForTitle(app, settings, file, progressReporter);
            await delay(1); // Yield

            // Move Successfully Processed File
            try {
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
            } catch (moveError: unknown) { // Changed to unknown
                const errorMessage = moveError instanceof Error ? moveError.message : String(moveError);
                const moveErrorMsg = `Error moving processed file ${file.name} to ${completeFolderPath}: ${errorMessage}`;
                console.error(moveErrorMsg, moveError); progressReporter.log(`❌ ${moveErrorMsg}`);
                errors.push({ file: file.name, message: `Failed to move after generation: ${errorMessage}` });
            }
        } catch (fileError: unknown) { // Changed to unknown
            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
            const errorMsg = `Error generating content for ${file.name}: ${errorMessage}`;
            console.error(errorMsg, fileError); progressReporter.log(`❌ ${errorMsg}`);
            errors.push({ file: file.name, message: errorMessage });
            // Log error silently
            const timestamp = new Date().toISOString();
            const errorDetails = fileError instanceof Error ? fileError.stack || fileError.message : String(fileError);
            const logEntry = `[${timestamp}] Error generating content for ${file.path}:\nMessage: ${errorMessage}\nStack Trace:\n${errorDetails}\n\n`;
            try { await app.vault.adapter.append('error_processing_filename.log', logEntry); }
            catch (logError: unknown) { // Changed to unknown
                 const logErrorMessage = logError instanceof Error ? logError.message : String(logError);
                 console.error("Failed to write to error_processing_filename.log:", logError);
                 progressReporter.log(`⚠️ Failed to write error details to log file: ${logErrorMessage}`);
            }

            if (errorMessage.includes("cancelled by user")) { break; }
        }
        if (progressReporter.cancelled) { break; }
    }
    return { errors }; // Return collected errors
}

/**
 * Checks for duplicate concept notes based on PowerShell script logic.
 * Reports potential duplicates and prompts the user for deletion confirmation.
 * @param app Obsidian App instance.
 * @param settings Plugin settings.
 * @param progressReporter Interface for reporting progress.
 */
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
