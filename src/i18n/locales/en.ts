export const STRINGS_EN = {
    common: {
        language: 'Language',
        select: 'Select',
        cancel: 'Cancel',
        close: 'Close',
        copy: 'Copy',
        ready: 'Ready',
        standby: 'Standby',
        unknownError: 'Unknown error'
    },
    commands: {
        checkDuplicatesCurrent: 'Check for duplicates in current file',
        extractConceptsAndGenerateTitles: 'Extract Concepts and Generate Titles',
        createWikiLinkAndGenerateNoteFromSelection: 'Create Wiki-Link & Generate Note from Selection'
    },
    plugin: {
        viewName: 'Notemd Workbench',
        ribbonTooltip: 'Open Notemd sidebar'
    },
    folderPicker: {
        title: 'Select folder',
        vaultRoot: '(Vault Root)',
        selectAction: 'Select'
    },
    duplicateModal: {
        title: 'Confirm duplicate deletion',
        intro: 'The following {count} concept notes are identified as potential duplicates and will be moved to system trash:',
        reason: 'Reason: {reason}',
        conflictsWith: 'Conflicts with: {files}',
        warning: 'This action cannot be easily undone from within Obsidian, but files can usually be recovered from the system trash.',
        deleteFiles: 'Delete {count} files'
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
        notemdBusy: 'Notemd is busy.',
        duplicateTermsFound: 'Found {count} potential duplicate terms.',
        duplicateTermsCheckConsole: 'Found {count} potential duplicate terms. Check console.',
        duplicateTermsCheckLogConsole: 'Found {count} potential duplicate terms. Check log and console.',
        duplicateCheckError: 'Error checking duplicates: {message}',
        noActiveTextFileSelected: "No active '.md' or '.txt' file selected.",
        noActiveProviderConfigured: 'No active LLM provider configured. Please check Notemd settings.',
        noActiveMarkdownFileSelectedOrChanged: 'No active Markdown file selected or file changed.',
        noActiveMarkdownFileSelected: 'No active Markdown file selected.',
        noActiveMarkdownEditorFound: 'No active Markdown editor found.',
        selectValidWord: 'Select a valid word (2+ chars).',
        setConceptNoteFolder: 'Set Concept Note Folder in settings.',
        generatedContentForWord: 'Generated content for [[{word}]]!',
        genericError: 'Error: {message}',
        couldNotOpenSidebar: 'Could not open Notemd sidebar.',
        processingComplete: 'Notemd processing complete!',
        extractionCompleteSavedTo: 'Extraction complete. Saved to {path}',
        noMarkdownFilesFoundSelectedFolder: 'No markdown files found in the selected folder.',
        batchTranslationCompleted: 'Batch translation of {count} files completed.',
        batchTranslationFailed: 'Batch translation failed. See console for details.',
        fileEmpty: 'File is empty.',
        noTranslationProviderConfigured: 'No provider configured for translation.',
        failedCreateTranslationFolder: "Failed to create translation folder: {path}. Defaulting to original file's folder.",
        translatedFileSavedTo: 'Translated file saved to {path}',
        failedTranslateFile: 'Failed to translate file. See console for details.',
        duplicateDeletionCancelled: 'Duplicate deletion cancelled.',
        duplicateCheckComplete: 'Duplicate check complete.',
        duplicateCheckCompleteCancelled: 'Duplicate check complete (deletion cancelled).',
        noPotentialDuplicateConceptNotesFound: 'No potential duplicate concept notes found.',
        deletionCompleteSummary: 'Deletion complete. Deleted {deleted} of {total} identified files. Encountered {errors} errors.'
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
