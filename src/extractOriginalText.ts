import { App, TFile, Notice } from 'obsidian';
import { NotemdSettings, ProgressReporter } from './types';
import { callLLM } from './llmUtils';
import NotemdPlugin from './main'; // Import the plugin class to access helper methods

export async function extractOriginalText(
    app: App,
    plugin: NotemdPlugin, // Pass plugin instance
    file: TFile,
    reporter: ProgressReporter
): Promise<void> {
    const settings = plugin.settings;
    const questions = settings.extractQuestions.split('\n').map(q => q.trim()).filter(q => q.length > 0);

    if (questions.length === 0) {
        throw new Error("No questions configured in settings for extraction.");
    }

    const fileContent = await app.vault.read(file);
    const results: string[] = [];

    // Use the specific provider/model for this task
    const { provider, modelName } = plugin.getProviderAndModelForTask('extractOriginalText');
    
    reporter.log(`Using provider: ${provider.name}, Model: ${modelName}`);

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (reporter.cancelled) break;

        reporter.updateStatus(`Extracting answer for question ${i + 1}/${questions.length}...`, Math.floor((i / questions.length) * 100));
        reporter.log(`Processing question: "${question}"`);

        // Get prompt using the centralized utility
        // Note: The prompt template expects {REFERENCE_CONTENT} and {USER_INPUT}
        const prompt = plugin.getPromptForTask('extractOriginalText', {
            'REFERENCE_CONTENT': fileContent,
            'USER_INPUT': question
        });
        
        try {
            // We use a generic system prompt and pass the constructed task prompt as content
            const systemPrompt = "You are a strict Data Extraction and Verification Agent.";
            const fullUserContent = prompt; 

            const response = await callLLM(provider, systemPrompt, fullUserContent, settings, reporter, modelName);
            results.push(response.trim());
        } catch (error: any) {
            reporter.log(`Error extracting for question "${question}": ${error.message}`);
            results.push(`${question} - Error: ${error.message}`);
        }
    }

    if (reporter.cancelled) return;

    reporter.updateStatus('Saving results...', 95);
    
    const outputContent = results.join('\n');
    const newFileName = `${file.basename} - Extracted.md`;
    let newFilePath = `${file.parent?.path === '/' ? '' : file.parent?.path + '/'}${newFileName}`;
    
    // Handle potential duplicate filenames
    let counter = 1;
    while (app.vault.getAbstractFileByPath(newFilePath)) {
        newFilePath = `${file.parent?.path === '/' ? '' : file.parent?.path + '/'}${file.basename} - Extracted (${counter}).md`;
        counter++;
    }

    await app.vault.create(newFilePath, outputContent);
    reporter.log(`Created extracted file: ${newFilePath}`);
    new Notice(`Extraction complete. Saved to ${newFileName}`);
}
