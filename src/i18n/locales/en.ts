export const STRINGS_EN = {
    common: {
        language: 'Language',
        cancel: 'Cancel',
        close: 'Close',
        copy: 'Copy',
        ready: 'Ready',
        standby: 'Standby',
        unknownError: 'Unknown error'
    },
    settings: {
        language: {
            heading: 'Language settings',
            outputName: 'Output language',
            outputDesc: 'Select the desired output language for LLM responses.',
            perTaskName: 'Select different languages for different tasks.',
            perTaskDesc: 'On: Select a specific language for each task below. Off: Use the single "Output language".',
            disableAutoTranslationName: 'Disable auto translation (except for "Translate" task)',
            disableAutoTranslationDesc:
                'On: Non-Translate tasks do not force a target language or auto-translate outputs. The explicit "Translate" task still performs translation as configured.',
            taskLanguageLabel: '{task} language',
            taskLanguageDesc: 'Select the output language for "{task}".'
        },
        developer: {
            modeName: 'Developer mode',
            modeDesc: 'On: Show dedicated developer diagnostic tools in settings. Off: Hide developer-only controls.',
            heading: 'Developer diagnostics',
            runDiagnostic: 'Run diagnostic',
            runStability: 'Run stability test'
        }
    },
    sidebar: {
        heroTitle: 'Notemd Workbench',
        heroDesc: 'Run single actions or custom one-click workflows with live progress and logs.',
        quickWorkflowTitle: 'Quick Workflows',
        quickWorkflowDesc: 'Custom buttons assembled from built-in actions.',
        builtInActionsPrefix: 'Built-in {category} actions.',
        logOutputTitle: 'Log output',
        copyLog: 'Copy log',
        copyLogSuccess: 'Log copied!',
        copyLogFailed: 'Failed to copy log.',
        logEmpty: 'Log is empty.',
        cancelProcessing: 'Cancel processing',
        workflowFallbackWarning: 'Workflow DSL has {count} issue(s). Sidebar is using default fallback.',
        languageChangedNotice: 'Language changed to {language}'
    },
    notices: {
        processingAlreadyRunning: 'Processing already in progress.',
        anotherProcessRunning: 'Another process is running. Please wait.',
        notemdBusy: 'Notemd is busy.'
    },
    errorModal: {
        copyDetails: 'Copy Error Details',
        copied: 'Copied!',
        copySuccessNotice: 'Error details copied to clipboard!',
        copyFailedNotice: 'Failed to copy error details. See console.'
    }
};

export type NotemdEnglishStrings = typeof STRINGS_EN;
