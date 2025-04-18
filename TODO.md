# Notemd Obsidian Plugin Development Plan

## Core Functionality to Port from PowerShell Scripts

1. **Document Processing Pipeline**
   - [x] Implement file processing with LLM integration (basic DeepSeek support)
   - [x] Support multiple LLM providers (OpenAI, Anthropic, LMStudio, Ollama)
   - [x] Add basic Obsidian backlink generation (capitalized words)
   - [x] Preserve original content while enhancing structure

2. **Duplicate Detection & Management**
   - [x] Implement basic duplicate detection (exact matches)
   - [x] Add symbol normalization checks (quotes, dashes, possessives)
   - [x] Create multi-word containment logic (2-5 word phrases)
   - [x] Build single-word containment checks (nested word detection)

3. **Knowledge Graph Integration**
   - [x] Automatically create linked notes
   - [x] Manage backlinks between documents (renaming/deletion support)

## Plugin Architecture Components

1. **Main Plugin Class**
   - [x] Extend `Plugin` base class
   - [x] Implement `onload`/`onunload` lifecycle
   - [x] Add settings management

2. **UI Components**
   - [x] Settings tab for configuration including:
     * LLM provider selection (DeepSeek)
     * Model name input
     * Temperature slider (0-1)
     * Base URL for API endpoint
     * Secure API key input
     * Generated files storage options:
       - Default location (same as source)
       - Custom folder option with picker
   - [x] Ribbon icon for quick actions
   - [x] Status bar indicators (processing state, errors)
   - [x] Processing modal dialogs with:
     * Status updates
     * Progress bar
     * Log output
     * Cancel button
     * File/folder selection options (manual path input or folder picker)
     * Current file vs batch processing modes
     * Per-process LLM parameter overrides
     * Overall completion percentage
     * Chunk processing status

3. **Command Palette Integration**
   - [x] Add "Process Current File" command
   - [x] Add "Process Files in Folder" command with:
     * Recursive subfolder option
     * Path input (manual or picker)
   - [x] Add "Check for Duplicates" command
     * Checks active file for duplicate words
     * Normalizes text for comparison
     * Reports results via Notice and console

4. **File Operations**
   - [x] Implement file splitting/merging
   - [x] Add progress tracking UI with modal dialog
   - [x] Handle error recovery
     * Added try/catch blocks for file operations  
     * Improved error reporting to user
     * Maintained processing state on failure
     * Added console logging for debugging

## Development Steps

1. **Initial Setup**
   - [x] Review sample plugin code
   - [x] Analyze existing PowerShell scripts
   - [x] Create TypeScript project structure

2. **Core Functionality**
   - [x] Implement LLM provider abstraction (basic)
   - [x] Create document processor
     * Added `splitContent` method for chunking large files based on paragraphs.
     * Modified `processContentWithLLM` to iterate through chunks and call the appropriate LLM API for each.
     * Concatenated results from chunk processing.
   - [x] Build backlink generator
     * Implemented `generateObsidianLinks` to extract concepts from LLM output.
     * Implemented `createConceptNotes` to automatically create/update notes for linked concepts.
     * Added `handleFileRename` and `handleFileDelete` for backlink maintenance.

3. **UI Implementation**
   - [x] Design settings interface
   - [x] Create processing status UI
     * Modified `processFile`, `processFolderWithNotemd`, and `processContentWithLLM` to accept and use `ProgressModal`.
     * Added logging of chunk processing progress to the modal.
   - [x] Add error reporting
     * Added error reporting to ProgressModal
     * Added error logging to console
     * Added user notifications for errors

4. **Testing & Refinement**  
   - [x] Unit tests for all core functions (splitContent, generateObsidianLinks, duplicate handling, and file operations implemented)  
   - [ ] Integration testing (future work)  
   - [ ] Performance optimization (future work)  

## User Feedback / Refinements (April 2025)

1.  **API Connection Test:**
    -   [x] Implement provider-specific API connection test (`testAPI`).
    -   [x] Add "Test Connection" button to Settings Tab.
    -   [x] Update "Test LLM Connection" command to use refined test and provide clear feedback.
2.  **Copyable Error Messages:**
    -   [x] Create `ErrorModal` class to display errors in a selectable format with a copy button.
    -   [x] Integrate `ErrorModal` into main processing `catch` blocks (`processWithNotemd`, `processFolderWithNotemd`).
    -   [x] Integrate `ErrorModal` into `test-llm-connection` command `catch` block.
3.  **Sidebar UI:**
    -   [x] Create `NotemdSidebarView` extending `ItemView`.
    -   [x] Register the view and add ribbon icon/command to open it.
    -   [x] Add action buttons (Process File/Folder, Check Duplicates, Test Connection) to the sidebar view.
    -   [x] Add progress bar, status text, and log display area to the sidebar view.
    -   [x] Implement `ProgressReporter` interface for both `ProgressModal` and `NotemdSidebarView`.
    -   [x] Update processing methods to accept and use `ProgressReporter` (showing progress in sidebar when initiated there).
    -   [x] Add "Copy Log" button to sidebar view.
    -   [ ] Make processing truly asynchronous/non-blocking (e.g., using web workers) to prevent UI freezes during long LLM calls. (Future Work / Advanced)
4.  **Concept Log File Generation:**
    -   [x] Add settings for enabling log file generation.
    -   [x] Add settings for customizing log file name and folder path.
    -   [x] Implement logic in `createConceptNotes` to call `generateConceptLog`.
    -   [x] Implement `generateConceptLog` to create the log file based on settings.

## Configuration Requirements

1. **Environment Variables**
   - [x] API keys for LLM providers
   - [x] Processing parameters (chunk size, temperature, etc.)
   - [x] File paths and directories

2. **Plugin Settings**
   - [x] Default LLM provider selection (including local providers)
   - [x] Processing options (supports both cloud and local LLMs)
   - [x] Duplicate detection preferences

## Dependencies

1. **Required Packages**
   - [x] `obsidian` (peer dependency)
   - [x] `axios` for API requests
   - [x] `lodash` for utilities

2. **Build Tools**
   - [x] esbuild (from sample plugin)
   - [x] TypeScript
   - [x] ESLint

## Deployment Steps

1. Build the plugin:
   ```bash
   npm run build
   ```
2. Create a release zip file containing:
   - main.js
   - styles.css
   - manifest.json
3. Publish to Obsidian's community plugins:
   - Create a GitHub release
   - Submit to Obsidian's plugin review queue
4. Update documentation:
   - README.md with installation instructions
   - CHANGELOG.md with version history

## Implementation Notes

1. Full TypeScript implementation
2. Processing engine must:
   - [x] Handle large files via chunking
   - [x] Provide real-time progress updates
   - [x] Support cancellation
3. UI must show:
   - [x] Current operation status
   - [x] Detailed processing log
   - [x] Estimated time remaining
