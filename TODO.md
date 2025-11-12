# Plan: Align "Extract Concepts" with Existing Behaviors and Improve UX

Goal: Ensure the “Extract Concepts” feature (1) consistently respects the Concept Log settings, (2) only creates concept notes without modifying source documents, and (3) properly supports cancellation, aligned with the behavior of “Process file (add links)”.

## 1. Current Behavior Summary

Two main flows are relevant:

1) Add Links / processFile flow

- Location:
  - processFile and saveOrMoveProcessedFile in src/fileUtils.ts
  - Commands in src/main.ts (process-with-notemd, process-folder-with-notemd)
- Behavior:
  - Uses the "addLinks" task (LLM + prompt) to transform content and insert [[links]].
  - Extracts concepts from processed content via [[...]] patterns.
  - Calls createConceptNotes to create/update concept notes in the configured concept note folder.
  - Uses saveOrMoveProcessedFile to:
    - Overwrite the original file, or
    - Move it, or
    - Write a processed copy (suffix-based), based on settings.
- Characteristics:
  - Intentionally mutates or moves source files.
  - Concept notes are a by-product of link insertion.
  - File output behavior is fully parameterized via processed-file-related settings.

2) Extract Concepts / extractConceptsFromFile flow

- Location:
  - extractConceptsFromFile and related commands in src/fileUtils.ts and src/main.ts
- Behavior:
  - Reads source file content.
  - Splits into chunks and calls LLM with the "extractConcepts" prompt.
  - Parses LLM output lines starting with "CONCEPT:" and collects concepts into a Set.
  - Returns concepts; does not modify or save the source file.
  - The command handlers then call createConceptNotes to generate concept notes.
- Characteristics:
  - Source documents are read-only in this flow.
  - Concept note creation is explicit and separate from any content rewriting.

Conclusion:

- "Process file (add links)" and "Extract concepts" use different output strategies:
  - Add Links: uses saveOrMoveProcessedFile with rich settings.
  - Extract Concepts: relies on createConceptNotes; no source modifications.
- Concept Log configuration is shared via createConceptNotes/generateConceptLog, but this is not clearly surfaced as “also applies to Extract Concepts”.
- Cancel behavior for Extract Concepts exists at the code level (via ProgressReporter.cancelled checks) but may not be consistently wired in the UI.

## 2. Concept Log Behavior for Extract Concepts

Existing logic:

- createConceptNotes:
  - Writes concept notes into settings.conceptNoteFolder (when enabled).
  - After creating new notes, optionally calls generateConceptLog.
- generateConceptLog:
  - Determines log path using:
    - If useCustomConceptLogFolder && conceptLogFolderPath: use that folder
    - Else if useCustomConceptNoteFolder && conceptNoteFolder: use concept note folder
  - Uses conceptLogFileName / default name; overwrites the log file with the latest run’s created concepts.

Implication:

- Any call to createConceptNotes (including from Extract Concepts) already respects:
  - Concept log output folder
  - Concept log file name
  - Overwrite behavior
- However:
  - This coupling is implicit.
  - There is no explicit per-task toggle for whether Extract Concepts should generate the log.

Decision:

- Treat "Concept log file output" as a shared configuration for all concept-note-creation flows (Add Links and Extract Concepts).
- Make this explicit in documentation and settings UI.
- Optionally, introduce a dedicated toggle if users need more granular control (see section 4.3).

## 3. Cancel Behavior for Extract Concepts

Current implementation:

- extractConceptsFromFile:
  - In each chunk:
    - Checks progressReporter.cancelled.
    - If true, throws "Concept extraction cancelled by user."
- batchExtractConceptsForFolderCommand:
  - Checks useReporter.cancelled between files.
  - Stops when cancelled.
- Error handling:
  - Command handlers treat “cancelled by user” messages specially (no error modal for normal cancellations).

Problem observed:

- In the UI, when running Extract Concepts:
  - “Cancel processing” appears disabled (greyed out).
  - This suggests:
    - The ProgressReporter implementation (Sidebar/Modal) is not enabling the cancel button for Extract Concepts flows, or
    - The command wiring does not register Extract Concepts as a cancellable operation in the same way as Add Links.

Goal:

- Extract Concepts should support cancellation:
  - The same as Add Links:
    - Visible/active Cancel button.
    - Setting cancelled = true.
    - Loops exit promptly and cleanly.

## 4. Implementation Plan

### 4.1 Clarify and Solidify Concept Log Usage in Extract Concepts

Objectives:

- Ensure Extract Concepts uses Concept Log output settings consistently.
- Make the behavior explicit and understandable.

Actions:

- Keep using createConceptNotes → generateConceptLog for all concept-note creation:
  - This already:
    - Uses Concept Log folder and file name config.
    - Overwrites the log on each run.
- Update documentation and NotemdSettingTab UI:
  - Clearly state:
    - “Concept Log settings apply to all concept notes created by the plugin (including Extract Concepts and Add Links).”
- Optional (if needed):
  - Add settings flag:
    - extractConceptsGenerateLog: boolean
      - When false: skip generateConceptLog for Extract Concepts runs.
  - Implement by passing a mode parameter or option into createConceptNotes/generateConceptLog or by branching at call sites.

### 4.2 Ensure Extract Concepts Never Modifies Source Files

Current code is already read-only for Extract Concepts; enforce this contract explicitly:

- Confirm in src/main.ts:
  - extract-concepts-from-current-file command:
    - Calls extractConceptsFromFile.
    - Calls createConceptNotes.
    - Does not call processFile or saveOrMoveProcessedFile.
  - batch-extract-concepts-from-folder command:
    - Same pattern for multiple files.
- Add defensive guarantees:
  - No Extract Concepts code path invokes:
    - saveOrMoveProcessedFile
    - processFile
    - Any mutation to the original TFile.

This keeps Extract Concepts behavior strictly:

- Read source.
- Generate concept notes.
- Do not touch original documents.

### 4.3 Make Concept Note Creation for Extract Concepts Explicit and Configurable

Goals:

- Provide clear, predictable behavior for Extract Concepts concept notes.
- Avoid unintended “Linked From” backlinks when not desired.

Actions:

1) Implement minimalTemplate option in createConceptNotes (if not fully applied):

- When creating a new concept note:
  - Always start with:
    - "# {concept}\n"
- If options.minimalTemplate === true:
  - Do NOT append “## Linked From” or any other sections.
- If options.minimalTemplate !== true:
  - Preserve existing behavior:
    - Add backlinks only when:
      - !options.disableBacklink
      - currentProcessingFileBasename is provided.

2) Add Extract Concepts–specific settings:

- In NotemdSettings:
  - extractConceptsMinimalTemplate: boolean
  - extractConceptsAddBacklink: boolean
- In NotemdSettingTab:
  - Add UI controls:
    - “Extract Concepts: use minimal template for concept notes”
    - “Extract Concepts: add ‘Linked From’ backlink to source file”

3) Apply settings in Extract Concepts commands:

- For single-file Extract Concepts:
  - currentSource = activeFile.basename
  - const concepts = await extractConceptsFromFile(...);
  - if (concepts.size > 0) {
      await createConceptNotes(app, this.settings, concepts,
        this.settings.extractConceptsAddBacklink ? currentSource : null,
        {
          disableBacklink: !this.settings.extractConceptsAddBacklink,
          minimalTemplate: this.settings.extractConceptsMinimalTemplate
        }
      );
    }

- For batch Extract Concepts:
  - For each file, pass its basename as currentProcessingFileBasename under the same settings rules.

Result:

- Users can choose:
  - Minimal “# Concept” notes with no backlinks, or
  - Notes that include a “Linked From [[source]]” section.
- Behavior is explicit and consistent across Extract Concepts runs.

### 4.4 Enable and Wire Up “Cancel processing” for Extract Concepts

Goals:

- Provide a consistent, working cancel experience for Extract Concepts.

Actions:

1) ProgressReporter / UI:

- Ensure that the same cancel controls used for Add Links are also:
  - Rendered and enabled when Extract Concepts commands run.
- If the cancel button visibility depends on task type:
  - Add Extract Concepts commands to the allowed/cancellable set.

2) Extraction loops (already partially implemented):

- extractConceptsFromFile:
  - Keep:
    - if (progressReporter.cancelled) throw new Error("Concept extraction cancelled by user.");
  - Ensure this check occurs:
    - Before each chunk processing.
    - Immediately after LLM calls where appropriate.

- batchExtractConceptsForFolderCommand:
  - Maintain:
    - If (useReporter.cancelled) break cleanly.
  - Optionally:
    - Add checks before calling createConceptNotes to avoid extra work after cancellation.

3) Error handling and UX:

- When cancelled:
  - Treat “cancelled by user” as a normal outcome:
    - No error modal.
    - Reporter shows “Cancelled”.
    - Status bar updated accordingly.
- Align this behavior with Add Links so users see a consistent pattern.

## 5. Final Expected Behavior

After these changes:

- Concept Log:
  - Concept log output settings are consistently applied to all concept note creation flows.
  - Optionally configurable per-task if desired.
- Extract Concepts:
  - Never modifies or moves source documents.
  - Only creates concept notes in the configured concept note folder.
  - Concept note content is controlled via:
    - extractConceptsMinimalTemplate
    - extractConceptsAddBacklink
- Cancel Support:
  - Extract Concepts operations can be canceled via the same UI controls as Add Links.
  - Cancellation is responsive and does not leave partial/long-running work.
- Overall:
  - “Extract Concepts” is predictable, safe, and aligned with the “Process file (add links)” ecosystem,
    while keeping the responsibilities of each flow clearly separated.
