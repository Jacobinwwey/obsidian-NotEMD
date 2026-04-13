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
    plugin: {
        viewName: 'Notemd Workbench',
        ribbonTooltip: 'Open Notemd sidebar'
    },
    settings: {
        language: {
            heading: 'Language settings',
            uiLocaleName: 'UI language',
            uiLocaleDesc: 'Select the language used for the plugin interface. "Auto" follows the current Obsidian language.',
            uiLocaleAuto: 'Follow Obsidian (Auto)',
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
        defaultWorkflowName: 'One-Click Extract',
        quickWorkflowTitle: 'Quick Workflows',
        quickWorkflowDesc: 'Custom buttons assembled from built-in actions.',
        sectionTitles: {
            core: 'Core Flow',
            generation: 'Generation & Mermaid',
            knowledge: 'Knowledge',
            translation: 'Translation',
            utilities: 'Utilities'
        },
        actions: {
            processCurrentAddLinks: {
                label: 'Process file (add links)',
                tooltip: 'Processes current file and creates wiki links/concept notes.'
            },
            processFolderAddLinks: {
                label: 'Process folder (add links)',
                tooltip: 'Processes all eligible notes in a folder.'
            },
            generateFromTitle: {
                label: 'Generate from title',
                tooltip: 'Generate note content from current note title.'
            },
            batchGenerateFromTitles: {
                label: 'Batch generate from titles',
                tooltip: 'Batch-generate content from note titles in a folder.'
            },
            researchAndSummarize: {
                label: 'Research & summarize',
                tooltip: 'Research selected topic/title and append summary.'
            },
            summarizeAsMermaid: {
                label: 'Summarise as Mermaid diagram',
                tooltip: 'Generate a Mermaid diagram summary from current note.'
            },
            translateCurrentFile: {
                label: 'Translate current file',
                tooltip: 'Translate the active file into selected output language.'
            },
            batchTranslateFolder: {
                label: 'Batch translate folder',
                tooltip: 'Translate all markdown files in a folder.'
            },
            extractConceptsCurrent: {
                label: 'Extract concepts (current file)',
                tooltip: 'Extract concepts from current file only.'
            },
            extractConceptsFolder: {
                label: 'Extract concepts (folder)',
                tooltip: 'Extract concepts from every file in a selected folder.'
            },
            extractOriginalText: {
                label: 'Extract specific original text',
                tooltip: 'Extract verbatim source excerpts for configured questions.'
            },
            batchMermaidFix: {
                label: 'Batch Mermaid fix',
                tooltip: 'Run Mermaid/LaTeX batch syntax fix on selected folder.'
            },
            fixFormulaCurrent: {
                label: 'Fix formula formats (current)',
                tooltip: 'Normalize formula delimiters in current file.'
            },
            batchFixFormula: {
                label: 'Batch fix formula formats',
                tooltip: 'Normalize formula delimiters across a selected folder.'
            },
            checkDuplicatesCurrent: {
                label: 'Check duplicates (current file)',
                tooltip: 'Detect duplicate terms in the current file.'
            },
            checkRemoveDuplicateConcepts: {
                label: 'Check & remove duplicates',
                tooltip: 'Detect and remove duplicate concept notes.'
            },
            testLlmConnection: {
                label: 'Test LLM connection',
                tooltip: 'Test active provider connection and credentials.'
            }
        },
        status: {
            runningAction: 'Running "{label}"...',
            actionComplete: '"{label}" complete',
            actionFailed: 'Action failed: {message}',
            workflowStart: 'Workflow: {name}',
            workflowComplete: 'Workflow "{name}" complete',
            workflowFailed: 'Workflow failed',
            workflowFailedLog: 'Workflow failed: {message}',
            workflowFinishedWithErrors: 'Workflow "{name}" finished with {count} error(s)',
            stepLabel: '[{current}/{total}] {label}',
            stepLog: 'Step {current}/{total}: {label}',
            stepFailed: 'Step failed: {message}',
            processingActive: 'Processing... (Active: {count})',
            timeRemaining: 'Est. time remaining: {time}',
            timeRemainingCalculating: 'Est. time remaining: calculating...',
            stopped: 'Stopped',
            processingStopped: 'Processing stopped.',
            cancelling: 'Cancelling...',
            userRequestedCancellation: 'User requested cancellation.'
        },
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
    },
    progressModal: {
        heading: 'Notemd processing',
        starting: 'Starting...',
        cancelProgress: 'Cancel',
        timeRemaining: 'Estimated time remaining: {time}',
        timeRemainingCalculating: 'Estimated time remaining: calculating...',
        cancelledOrError: 'Cancelled/Error',
        processingStopped: 'Processing stopped.',
        cancelling: 'Cancelling...',
        userRequestedCancellation: 'User requested cancellation.'
    }
};

export type NotemdEnglishStrings = typeof STRINGS_EN;
