import { App, TFile, Notice } from 'obsidian';
import { NotemdSettings, ProgressReporter } from '../types';
import { getProviderForTask, getModelForTask } from '../utils';
import { callLLM } from '../llmUtils';

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
        // Pass the signal to callLLM
        const translatedText = await callLLM(provider, prompt, fileContent, settings, progressReporter, model, signal);
        const savePath = settings.translationSavePath || 'translations';
        const suffix = settings.useCustomTranslationSuffix ? settings.translationCustomSuffix : `_${targetLanguage}`;
        const fileName = `${file.basename}${suffix}.md`;
        const fullPath = `${savePath}/${fileName}`;

        // Ensure the directory exists
        const dir = app.vault.getAbstractFileByPath(savePath);
        if (!dir) {
            await app.vault.createFolder(savePath);
        }

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
