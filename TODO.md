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
