# Plan: Fix “Extract Concepts” Cancel Behavior (English Implementation Plan)

Goal: Ensure that after recent code changes, the “Extract concepts” tasks fully support cancellation, consistent with “Process file (add links)”. Specifically:
- The “Cancel processing” button must be enabled during Extract Concepts runs.
- Clicking Cancel must reliably stop the current Extract Concepts operation.

## 1. Root Cause Summary

Current components and behavior:

1) ProgressModal (src/ui/ProgressModal.ts)
- Always renders an enabled “Cancel” button when opened.
- `requestCancel()`:
  - Sets `isCancelled = true`
  - Calls `updateStatus('Cancelling...', -1)`
  - Logs “User requested cancellation.”
  - Aborts `currentAbortController` (if set)
  - Disables the button
- `clearDisplay()`:
  - Resets `isCancelled`
  - Re-enables the Cancel button
- It does NOT depend on an `isProcessing` flag to enable Cancel.
- Conclusion: For tasks using ProgressModal directly, cancel support is implemented correctly.

2) NotemdSidebarView (src/ui/NotemdSidebarView.ts)
- Implements ProgressReporter for sidebar-driven operations.
- Tracks:
  - `isProcessing`
  - `isCancelled`
  - `currentAbortController`
- `updateButtonStates()`:
  - Disables all command buttons while `isProcessing` is true.
  - Enables “Cancel processing” ONLY when:
    - `isProcessing === true` AND `isCancelled === false`.
  - Otherwise disables the Cancel button.
- For sidebar buttons (e.g. Process file, Process folder, Translate, Summarise, Extract Concepts), each `onclick`:
  - Calls `this.clearDisplay()`
  - Sets `this.currentAbortController = new AbortController()`
  - Sets `this.isProcessing = true`
  - Calls `this.updateButtonStates()` (Cancel becomes enabled)
  - Awaits the plugin command with `this` as reporter
  - In `finally`:
    - Sets `this.isProcessing = false`
    - Calls `this.updateButtonStates()` (Cancel disabled again)
- Conclusion: When Extract Concepts is started via the sidebar buttons, Cancel should already work.

3) Extract Concepts logic (src/fileUtils.ts)
- `extractConceptsFromFile`:
  - Before each chunk:
    - If `progressReporter.cancelled` → `throw new Error("Concept extraction cancelled by user.");`
  - Uses `progressReporter.abortController?.signal` when calling LLM helpers.
- `batchExtractConceptsForFolderCommand` (in main.ts; not shown here but assumed):
  - Typical pattern: checks `useReporter.cancelled` and breaks loops on cancel.
- Conclusion: The internal loops already respect `ProgressReporter.cancelled` and are wired for cancellation.

Observed issue (from user report and screenshot):

- When “Extract concepts” is triggered (in some usage paths), the UI shows:
  - “Extracting concepts from chunk 1/1…”
  - A disabled “Cancel processing” button.
- This indicates:
  - The active reporter is the NotemdSidebarView (button label matches).
  - But its `isProcessing` was never set to true for this run, so `updateButtonStates()` kept Cancel disabled.
- Likely scenario:
  - Extract Concepts was run via a command (e.g. command palette), not via sidebar button.
  - In that path, `main.ts` uses:
    - `const useReporter = reporter || this.getReporter();`
  - `getReporter()` returns the sidebar view if it exists.
  - But `main.ts` does NOT set `isProcessing = true` on the sidebar when invoked this way.
  - As a result:
    - Sidebar’s Cancel button remains disabled (grey), even though the task is running and checking `cancelled`.

## 2. Design Principles for the Fix

1. Single source of truth:
   - The component that owns the UI (NotemdSidebarView / ProgressModal) should manage:
     - Whether a task is “processing”.
     - Whether Cancel is enabled.
   - Callers (commands in main.ts) must consistently signal “start” and “end” of processing.

2. Symmetry with Add Links:
   - Extract Concepts should follow the same pattern as:
     - Process current file
     - Process folder
     - Batch operations
   - No special-case UX differences unless intentional.

3. Non-breaking:
   - Do not break the existing working flows:
     - Sidebar buttons for Process/Translate/etc.
     - ProgressModal cancel behavior.

## 3. Concrete Changes

### 3.1 Introduce unified start/finish helpers on NotemdSidebarView (optional but recommended)

Add two methods to `NotemdSidebarView`:

```ts
startProcessing(initialStatus: string) {
    this.clearDisplay();
    this.currentAbortController = new AbortController();
    this.isProcessing = true;
    this.isCancelled = false;
    this.startTime = Date.now();
    this.updateStatus(initialStatus, 0);
    this.updateButtonStates();
}

finishProcessing() {
    this.isProcessing = false;
    this.updateButtonStates();
}
```

Notes:
- `clearDisplay()` already disables Cancel, resets flags; `startProcessing` immediately re-enables Cancel by setting `isProcessing = true` before calling `updateButtonStates()`.
- These helpers encapsulate the pattern currently duplicated in each button handler.

### 3.2 Ensure Extract Concepts commands mark the sidebar as processing when using it

In `src/main.ts`, for:

- `extractConceptsCommand(reporter?: ProgressReporter)`
- `batchExtractConceptsForFolderCommand(reporter?: ProgressReporter)`

Adjust the logic as follows:

1) Determine reporter:

```ts
const useReporter = reporter || this.getReporter();
if (!reporter) {
    useReporter.clearDisplay();
}
```

2) If `useReporter` is the sidebar (NotemdSidebarView), mark processing:

```ts
const maybeSidebar = useReporter as any;
if (maybeSidebar instanceof (NotemdSidebarView as any)) {
    // If you added helpers:
    maybeSidebar.startProcessing('Extracting concepts...');
} else {
    // For ProgressModal or other reporters:
    useReporter.updateStatus('Extracting concepts...', 0);
}
```

3) Run the core logic with try/finally:

```ts
try {
    await this.loadSettings();
    const activeFile = this.app.workspace.getActiveFile();
    // ... validations ...
    const concepts = await extractConceptsFromFile(this.app, this, activeFile, useReporter);
    // ... createConceptNotes, notices, etc ...
} catch (error) {
    // existing error and cancellation handling
} finally {
    // Ensure sidebar knows processing ended
    if (maybeSidebar instanceof (NotemdSidebarView as any)) {
        maybeSidebar.finishProcessing();
    }
    this.isBusy = false;
}
```

4) Apply the same pattern in `batchExtractConceptsForFolderCommand`:
- When `getReporter()` returns the sidebar, call `startProcessing('Batch extracting concepts...')` before the loop and `finishProcessing()` in `finally`.

Result:
- No matter whether Extract Concepts is started via:
  - Sidebar buttons (which already set isProcessing), or
  - Command palette / hotkey (via `getReporter()` returning sidebar),
- The sidebar’s `isProcessing` will become true while work is running, enabling the Cancel button.

### 3.3 Do not change ProgressModal cancel logic

- ProgressModal already:
  - Always shows an enabled Cancel button.
  - Sets `isCancelled` and aborts when clicked.
- No changes are required for Extract Concepts when using the modal:
  - It passes `abortController?.signal` to LLM calls.
  - `extractConceptsFromFile` checks `cancelled` and returns early.

### 3.4 Reconfirm loop checks (for completeness)

- Keep existing checks:

In `extractConceptsFromFile`:

```ts
for (...) {
    if (progressReporter.cancelled) {
        throw new Error("Concept extraction cancelled by user.");
    }
    ...
}
```

In `batchExtractConceptsForFolderCommand`:

```ts
if (useReporter.cancelled) { ... break; }
```

Optionally:
- Before calling `createConceptNotes` in batch mode, check `cancelled` again to avoid extra work after cancel.

## 4. Expected Behavior After Fix

- When “Extract concepts (current file)” or “Extract concepts (folder)” is run:
  - If using sidebar:
    - `isProcessing` is set to true.
    - “Cancel processing” button becomes enabled.
    - Clicking it sets `cancelled = true` and aborts the LLM calls.
    - The loop in `extractConceptsFromFile` sees `cancelled` and exits.
    - UI updates to “Cancelled” without error modals.
  - If using modal:
    - “Cancel” is enabled and works as before.
- Behavior is now:
  - Consistent with Add Links.
  - Clear and reliable from a user’s perspective.

This plan is fully captured in English and ready for implementation in TODO.md or direct code changes.
