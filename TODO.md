<<<<<<< HEAD
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
=======
# Notemd Plugin TODO List

This list outlines potential new features and improvements for the Notemd Obsidian plugin, inspired by the functionality of the `LMStudio-Markdown-Content-Generator` scripts and analysis of the current plugin code.

## New Major Features

-   [x] **Web Research & Summarization Command:** (Implemented using Tavily API)
    -   Create a new command (e.g., "Notemd: Research and Summarize Topic"). (Implemented)
    -   Input: Current note title or selected text. (Implemented)
    -   Action:
        -   Perform web search using Tavily API based on input query. (Implemented)
        -   Fetch content snippets from Tavily results. (Implemented)
        -   Summarize fetched content snippets using the configured LLM. (Implemented)
        -   Output: Append summary to the current note. (Implemented)
    -   Requires: Tavily API Key configured in settings. (Setting added)
    -   [x] **Add DuckDuckGo Search Support:**
        -   Add setting to choose between Tavily and DuckDuckGo. (Implemented)
        -   Implement DuckDuckGo HTML search parsing. (Implemented)
        -   Implement basic content fetching and text extraction for DDG results. (Implemented)
        -   Integrate into `researchAndSummarize` command. (Implemented)
        -   Add settings for DDG max results and fetch timeout. (Implemented)
    -   [x] **Add Research Content Token Limit:**
        -   Add setting (`maxResearchContentTokens`) to limit the approximate token count of combined research content sent for summarization. (Implemented)
        -   Implement token estimation and truncation logic in `researchAndSummarize`. (Implemented)

-   [x] **Generate Content from Title Command:**
    -   Create a new command (e.g., "Notemd: Generate Content for Note Title"). (Implemented)
    -   Input: Current note's title (especially useful for empty notes). (Implemented)
    -   Action:
        -   (Optional) Trigger Web Research & Summarization based on title. (Skipped due to web research being blocked)
        -   Prompt configured LLM to generate detailed documentation based on the title (and optional summary), requesting structure, technical details, LaTeX, Mermaid, etc. (similar to `mcp_md_done.ps1` prompt). (Implemented in `generateContentForTitle`)
        -   Replace the current note's content with the LLM response. (Implemented)
    -   Considerations: Prompt engineering, handling large responses. (Addressed via existing implementation)

## Enhancements & Improvements

-   [x] **Mermaid Syntax Validation & Fixing:**
    -   Integrate post-processing logic to validate and fix common Mermaid syntax issues in LLM output (e.g., ensure ` ```mermaid ` blocks are properly closed after last arrow `-->`).
    -   Adapt logic from `LMStudio-Markdown-Content-Generator/mermaid.py`.

-   [x] **LaTeX Math Delimiter Cleanup:**
    -   Add post-processing step to normalize LaTeX math delimiters (e.g., convert `\(` `\)` to `$`, ensure consistent spacing around `$`).
    -   Adapt logic from `LMStudio-Markdown-Content-Generator/mermaid.py`.

-   [x] **Enhanced Duplicate Concept Handling:**
    -   Improve concept note creation to avoid near-duplicates by normalizing names (e.g., "Topic-Name" vs "Topic Name" should likely point to the same note). Use logic similar to `process_string` from `mermaid.py`. (Normalization added)
    -   Explore options for detecting duplicate concepts *across* different notes (more complex, might require index scanning). (Further exploration pending)

-   [x] **Improved Batch Processing Robustness:**
    -   Modify `processFolderWithNotemd` to better handle errors on individual files.
    -   Allow the batch to continue if one file fails (e.g., LLM error).
    -   Collect errors and present a summary report (in the log/sidebar/modal) at the end of the batch.

-   [x] **Alternative Processed File Workflow:**
    -   Add a setting option: Instead of creating `_processed.md` files, *move* the original file to the designated "Processed File Folder" after successful processing.

-   [x] **Import/Export Provider Settings:**
    -   Add buttons in the settings tab to export the configured LLM providers (names, URLs, models, keys) to a JSON file.
    -   Add a button to import provider settings from a JSON file, merging/overwriting existing ones.

-   [x] **Refine Backlink Removal on Delete:**
    -   Review the regex logic in `handleFileDelete` to ensure it correctly removes links, especially when they are part of list items, without leaving malformed list structures.

-   [x] **UI/UX:**
    -   Consider adding progress indication for sub-steps within `processFile` (e.g., "Calling LLM", "Generating Links"). (Addressed via detailed logging)
    -   Ensure error messages displayed in Notices/Modals are user-friendly and guide towards checking logs/console for technical details. (Verified existing implementation)

## Code Refactoring & Chores

-   [x] **Review LLM API Call Error Handling:** Ensure consistent error handling and reporting across all `call...Api` functions. Provide more specific feedback based on status codes (e.g., 401 Unauthorized, 404 Not Found, 429 Rate Limit).
-   [x] **Add Unit/Integration Tests:** Implement tests for core logic like `splitContent`, `generateObsidianLinks`, `findDuplicates`, and potentially mock LLM calls. (Basic tests added/reviewed for core logic; LLM mocking pending)
>>>>>>> add-LMCG
