import { NotemdSettings, TaskKey } from './types';

// The function to get the default prompt for a task remains unchanged.
export function getDefaultPrompt(taskKey: TaskKey): string {
    // This is a simplified representation. In your actual code, this would
    // return the full, complex default prompt for the given task.
    return `This is the default prompt for ${taskKey}.`;
}

// New function to get the modified prompt for a task.
export function getModifiedPrompt(settings: NotemdSettings, taskKey: TaskKey): string {
    let prompt = getDefaultPrompt(taskKey);
    let useCustomPromptWord = false;
    let customPromptWord = '';

    switch (taskKey) {
        case 'addLinks':
            useCustomPromptWord = settings.useCustomPromptWordForAddLinks;
            customPromptWord = settings.customPromptWordAddLinks;
            break;
        case 'generateTitle':
            useCustomPromptWord = settings.useCustomPromptWordForGenerateTitle;
            customPromptWord = settings.customPromptWordGenerateTitle;
            break;
        case 'researchSummarize':
            useCustomPromptWord = settings.useCustomPromptWordForResearchSummarize;
            customPromptWord = settings.customPromptWordResearchSummarize;
            break;
    }

    if (useCustomPromptWord && customPromptWord) {
        // This is a simple replacement. You might need a more sophisticated
        // approach depending on the structure of your prompts.
        prompt = prompt.replace(/prompt/g, customPromptWord);
    }

    return prompt;
}
