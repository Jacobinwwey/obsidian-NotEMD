import { App, TFile, TFolder, Notice } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { getProviderForTask, getModelForTask, splitContent } from './utils';
import { callLLM } from './llmUtils';

export async function translateFile(
    app: App,
    settings: NotemdSettings,
    file: TFile,
    targetLanguage: string,
    progressReporter: ProgressReporter,
    signal?: AbortSignal
): Promise<string | null> {
    const fileContent = await app.vault.read(file);
    if (!fileContent) {
        new Notice('File is empty.');
        return null;
    }

    const provider = getProviderForTask('translate', settings);

    if (!provider) {
        new Notice('No provider configured for translation.');
        return null;
    }
    const model = getModelForTask('translate', provider, settings);

    const prompt = `Translate the following markdown document to ${targetLanguage}. Preserve the original markdown formatting, including headers, lists, bold, italics, links, etc. Only output the translated document.`;

    try {
        const chunks = splitContent(fileContent, settings);
        const totalChunks = chunks.length;
        let translatedChunks: string[] = [];

        for (let i = 0; i < totalChunks; i++) {
            if (signal?.aborted) {
                throw new Error('Translation cancelled by user.');
            }

            const chunk = chunks[i];
            const chunkProgress = Math.floor(((i) / totalChunks) * 100);
            progressReporter.updateStatus(`Translating chunk ${i + 1}/${totalChunks}...`, chunkProgress);
            progressReporter.log(`Translating chunk ${i + 1}/${totalChunks}...`);

            const translatedChunk = await callLLM(provider, prompt, chunk, settings, progressReporter, model, signal);
            translatedChunks.push(translatedChunk);
        }

        const translatedText = translatedChunks.join('\n\n');

        let savePath: string;

        if (settings.useCustomTranslationSavePath && settings.translationSavePath) {
            savePath = settings.translationSavePath;
            // Ensure the custom directory exists
            const dir = app.vault.getAbstractFileByPath(savePath);
            if (!dir) {
                try {
                    await app.vault.createFolder(savePath);
                } catch (error) {
                    console.error(`Error creating translation folder at ${savePath}:`, error);
                    new Notice(`Failed to create translation folder: ${savePath}. Defaulting to original file's folder.`);
                    // Fallback to original folder if creation fails
                    savePath = file.parent ? file.parent.path : '/';
                }
            }
        } else {
            // Default: Save in the same folder as the original file
            savePath = file.parent ? file.parent.path : '/';
        }

        const suffix = settings.useCustomTranslationSuffix ? settings.translationCustomSuffix : `_${targetLanguage}`;
        const fileName = `${file.basename}${suffix}.md`;
        
        // Handle root path correctly
        const fullPath = savePath === '/' || savePath === '' ? fileName : `${savePath}/${fileName}`;


        const existingFile = app.vault.getAbstractFileByPath(fullPath);
        if (existingFile) {
            await app.vault.modify(existingFile as TFile, translatedText);
        } else {
            await app.vault.create(fullPath, translatedText);
        }
        
        new Notice(`Translated file saved to ${fullPath}`);
        return fullPath;
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            progressReporter.log('Translation cancelled by user.');
            progressReporter.updateStatus('Cancelled', -1);
            throw new Error('Translation cancelled by user.'); // Re-throw for main.ts to catch
        }
        console.error('Translation Error:', error);
        new Notice('Failed to translate file. See console for details.');
        throw error; // Re-throw other errors as well
    }
}
