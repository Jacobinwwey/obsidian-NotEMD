# Plan: Improve "Extract Concepts" Feature Behavior

Goal: Ensure the “Extract Concepts” feature can reliably (1) only generate concept note files from extracted keywords, and (2) never modify the original source documents in this mode.

## 1. Current Behavior Analysis

There are two main code paths related to concepts and concept notes:

1) addLinks + processFile path

- Location:
  - processFile and saveOrMoveProcessedFile in src/fileUtils.ts.
- Behavior:
  - Uses the 'addLinks' task and its prompt to call the LLM.
  - Modifies or recreates content with [[concept]] links.
  - Extracts concepts from the processed content (via [[...]] links).
  - Calls createConceptNotes to create/update concept notes.
  - Uses saveOrMoveProcessedFile to overwrite the original file or create a processed copy.
- Conclusion:
  - This path intentionally alters content and/or filenames.
  - It does NOT satisfy the requirement “only create concept files, do not change source documents”.

2) extractConcepts + extractConceptsFromFile path

- Locations:
  - DEFAULT_PROMPTS.extractConcepts in src/promptUtils.ts
  - extractConceptsFromFile in src/fileUtils.ts
- Behavior of DEFAULT_PROMPTS.extractConcepts:
  - Instructs the LLM to output only lines in the form:
    - CONCEPT: Some Concept
  - No original text, no explanations, no extra formatting.
- Behavior of extractConceptsFromFile:
  - Reads the source TFile content.
  - Splits content into chunks.
  - For each chunk:
    - Builds the system prompt via getSystemPrompt(settings, 'extractConcepts').
    - Calls the configured LLM provider/model.
    - Parses only lines starting with "CONCEPT:" and collects them into a Set<string>.
  - Returns the set of unique concepts.
  - Does NOT:
    - Modify the source file.
    - Save or move any processed content.
    - Directly call createConceptNotes.
- Conclusion:
  - This function is strictly read-only with respect to the source document.
  - It already provides a safe basis for “no source modification” behavior.

## 2. Concept Note Creation Behavior

Concept notes are managed by createConceptNotes in src/fileUtils.ts.

Key points:

- Preconditions:
  - Requires settings.useCustomConceptNoteFolder === true and a valid settings.conceptNoteFolder.
- For each extracted concept:
  - Generates a normalized safeName and uses:
    - notePath = {conceptNoteFolder}/{safeName}.md
- If the file already exists:
  - If options?.disableBacklink is not set and currentProcessingFileBasename is provided:
    - Ensures the note contains:
      - A “## Linked From” section.
      - A “- [[{sourceFile}]]” backlink entry.
  - Only modifies the concept note file, not the original document.
- If the file does not exist:
  - Creates a new note with:
    - "# {concept}" as the title.
    - Optionally appends:
      - "## Linked From\n- [[{sourceFile}]]"
      - when backlinking is enabled.
- Options:
  - options?.disableBacklink:
    - When true, prevents adding or updating the “Linked From” backlinks.
  - options?.minimalTemplate:
    - Present in the signature but currently not used to alter the template.

Conclusion:

- All writes happen in the concept note folder, not in the source file.
- New concept notes are minimal (title plus optional backlinks), but “blank concept file” semantics are not yet explicit.

## 3. Gaps vs. Desired Behavior

Requirement:

1) Do not modify the original document when running “Extract Concepts”.
2) Only create concept note files (preferably minimal templates) based on extracted concepts.

Findings:

- Positive:
  - extractConceptsFromFile is already safe: it never modifies original documents.
  - Concept notes are written into a dedicated folder and do not require changing the source file.
- Gaps / Risks:
  1) Command wiring (main.ts):
     - The “Extract concepts (create concept notes only)” command must:
       - Use extractConceptsFromFile.
       - Then call createConceptNotes.
       - Never call processFile or saveOrMoveProcessedFile.
     - If incorrectly wired, it could unintentionally modify source content.
  2) “Blank concept file” semantics:
     - createConceptNotes always writes a title.
     - It may also write a “Linked From” backlink section by default.
     - options.minimalTemplate exists but is not implemented.
     - There is no dedicated, explicit “extract concepts mode” that guarantees:
       - No backlinks.
       - Minimal or empty body.

## 4. Recommended Changes (Implementation Plan)

To make the behavior explicit, safe, and configurable:

### 4.1 Implement minimalTemplate behavior in createConceptNotes

- Location:
  - src/fileUtils.ts -> createConceptNotes.
- Desired behavior when creating a new note:
  - Base:
    - let newNoteContent = `# ${concept}\n`;
  - If options?.minimalTemplate === true:
    - Do NOT append “Linked From” or any extra sections.
    - Result: a strictly minimal “blank shell” concept note.
  - If options?.minimalTemplate !== true:
    - Preserve current behavior:
      - Optionally add “## Linked From” and backlinks if:
        - !options?.disableBacklink
        - and currentProcessingFileBasename is provided.

### 4.2 Use explicit options in “Extract Concepts” commands

- Location:
  - src/main.ts (commands for “extract concepts from current file” and “extract concepts for folder”).
- Recommended pattern:

For each target file:

- const concepts = await extractConceptsFromFile(app, this, file, reporter);
- if (concepts.size > 0) {
    await createConceptNotes(
      app,
      this.settings,
      concepts,
      null,
      {
        disableBacklink: true,
        minimalTemplate: true
      }
    );
  }

Constraints:

- Do NOT call processFile.
- Do NOT call saveOrMoveProcessedFile.
- Do NOT modify the original markdown file.

Effect:

- Source documents remain unchanged.
- Concept notes are created as minimal “# ConceptName” files in the configured concept note folder.

### 4.3 Optional: Add dedicated settings for Extract Concepts behavior

In NotemdSettings (src/types.ts) and UI (src/ui/NotemdSettingTab.ts), add:

- extractConceptsMinimalTemplate: boolean
  - When true, use minimalTemplate mode in createConceptNotes.
- extractConceptsAddBacklink: boolean
  - When true, allow “Linked From [[source]]” in Extract Concepts mode.
  - When false, always pass disableBacklink: true.

Then, in command handlers:

- Map these settings to the options passed into createConceptNotes.
- This gives users explicit control over:
  - Whether extracted concept notes are pure shells or include backlinks.
  - While still guaranteeing original documents are not modified.

## 5. Expected Outcome

After implementing the above:

- The “Extract Concepts” feature:
  - Uses a read-only extraction pipeline (extractConceptsFromFile).
  - Generates concept notes into the configured concept note folder.
  - Does not alter original markdown files.
- In strict “blank concept file” mode:
  - Each extracted concept creates a minimal note (e.g., only “# ConceptName”).
- The behavior becomes:
  - Explicit and predictable.
  - Safe against unintended edits.
  - Extensible for future improvements (templates, metadata, backlinks).
