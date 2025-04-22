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
    -   [x] Added logic to remove parentheses `()` and curly braces `{}` from within Mermaid blocks. (April 2025)

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

## API Call Enhancements

-   [x] **Custom Multi-Model Settings:** (Settings UI and core logic implemented)
    -   [x] Add a setting (`useMultiModelSettings`) to allow different models for different tasks (Add Links, Research/Summarize, Generate from Title). (Implemented in Settings)
    -   [x] If enabled, provide separate model selection dropdowns for each task in settings. (Implemented in Settings)
    -   [x] If disabled (default), use a single model setting for all tasks. (Handled by `getProviderForTask`)
    -   [x] Update task execution logic (`processContentWithLLM`, `researchAndSummarize`, `generateContentForTitle`) to use the appropriate model based on this setting. (Implemented via `getProviderForTask`)

-   [x] **Stable API Call Settings (Retry Logic):** (Settings UI and core logic implemented)
    -   [x] Add a setting (`enableStableApiCall`) to enable retry logic for LLM API calls. (Implemented in Settings)
    -   [x] If enabled, add settings for `apiRetryInterval` (seconds) and `apiRetryAttempts`. (Implemented in Settings)
    -   If disabled (default), a single API call failure skips the task and alerts the user.
    -   [x] Refactor core API call functions (`call...Api`) to implement the retry logic (wait interval, attempt count) when this setting is enabled.

## New Batch Processing & Output Requirements (April 2025)

-   [x] **Silent Error Logging:** During batch processing, save error messages for failed files silently to `error_processing_[filename].log` in the vault root instead of showing pop-up notifications. (Implemented by removing Notice calls in `processContentWithLLM` and `generateContentForTitle` error handlers, and ensuring batch functions log to file.)
-   [x] **Silent Batch Execution:** Prevent files from being opened in the main editor interface during batch processing tasks ('Add Links', 'Generate from Title'). (Refactored `generateContentForTitle` to accept `TFile` argument; updated `batchGenerateContentForTitles` to pass file directly without opening.)
-   [x] **Custom Output Filename (Add Links):**
    -   [x] Add a checkbox setting: "Use custom output filename suffix for 'Add Links'". (Implemented in Settings)
    -   [x] Add a text input setting: "Custom suffix/replacement string". (Implemented in Settings)
    -   [x] If unchecked, default behavior is `filename_processed.md`. (Handled in `processFile`)
    -   [x] If checked and input is empty, overwrite the original file (`filename.md`). (Handled in `processFile`)
    -   [x] If checked and input is "suffix", generate `filenamesuffix.md`. (Handled in `processFile`)
    -   [x] Update the 'Add Links' batch processing logic (`processFile`) to respect these settings. (Implemented in `processFile`)
-   [x] **Batch Task Cancel Button:** Implement a mechanism (e.g., a button in a modal or status bar) to allow users to cancel ongoing batch processing tasks. (Implemented via `ProgressReporter` interface, `ProgressModal`, and `NotemdSidebarView` cancel buttons and checks within batch loops)
    -   [x] Refined API retry logic to improve cancel responsiveness during waits. (April 2025)
-   [x] **Customizable 'Generate from Title' Output Folder:**
    -   [x] Modify the 'Generate Content for Note Title' batch process (`batchGenerateContentForTitles`) to move successfully processed files to a dedicated subfolder within the processed folder to prevent reprocessing. (Implemented)
    -   [x] Add a checkbox setting: "Use custom output folder name for 'Generate from Title'". (Implemented in Settings)
    -   [x] Add a text input setting: "Custom output folder name". Default placeholder: `_complete`. (Implemented in Settings)
    -   [x] If unchecked, use the default folder name `[original_foldername]_complete`. (Handled in `batchGenerateContentForTitles`)
    -   [x] If checked, use the user-provided folder name `[custom_name]`. (Handled in `batchGenerateContentForTitles`)
    -   [x] Ensure subsequent runs skip files within this designated completed folder. (Implemented in `batchGenerateContentForTitles` filtering logic)
