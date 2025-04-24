# NoteMD Plugin - Testing & TODO List (Based on User Report)

## Issue 1: Batch Generate from Title - Cancel Button Unresponsive / Stuck Disabled
- **Observation:** User reports the cancel button in the sidebar does not stop the 'Batch Generate from Titles' task, provides no feedback, and **stays disabled ("lit up")** after being clicked or after a task finishes/errors.
- **Files to Check:**
    - `main.ts`: `batchGenerateContentForTitles` function.
    - `main.ts`: API call functions (`call*Api`) - how `ProgressReporter.cancelled` and `AbortController` are used. (Previously checked, potentially related to feedback).
    - `main.ts`: `NotemdSidebarView` class - `requestCancel` method, cancel button's `onclick` handler, `updateButtonStates` method (or similar logic), and `finally` blocks in task button handlers.
    - `main.ts`: `ProgressReporter` interface and implementations.
    - `main.ts`: `cancellableDelay` function.
- **Investigation Steps & Findings:**
    1.  ✅ Verify `batchGenerateContentForTitles` checks `reporter.cancelled`. (Confirmed)
    2.  ✅ Confirm `generateContentForTitle` passes `reporter` down. (Confirmed)
    3.  ✅ API call functions use `reporter.abortController.signal` and `cancellableDelay`. (Fixes previously applied - 2025-04-24).
    4.  ✅ `NotemdSidebarView.requestCancel` sets flag and aborts controller. (Confirmed)
    5.  ❓ **NEW:** Check `NotemdSidebarView`'s button state management:
        *   Does `updateButtonStates` (or equivalent logic) correctly enable/disable the `cancelButton` based on an `isProcessing` flag?
        *   Are the `finally` blocks in the `onclick` handlers for **all** processing tasks (Process File/Folder, Batch Generate, Research) reliably setting `isProcessing = false` and calling `updateButtonStates()` to reset button states (disable cancel, enable actions) even if errors occur?
        *   Does the `cancelButton`'s own `onclick` handler correctly update its state or rely solely on the task's `finally` block?
-   **Required Fixes:**
    1.  [COMPLETED - 2025-04-24] Modify `call*Api` functions for cancellation.
    2.  [COMPLETED - 2025-04-24] Ensured robust button state management in `NotemdSidebarView` by introducing `updateButtonStates()` and calling it from `clearDisplay`, `requestCancel`, and the start/`finally` blocks of all processing task handlers.
-   **Status:** [READY FOR TESTING] Code changes for button state management are complete.
-   **Testing:**
    1. Start a long batch process. Click 'Cancel'. Verify process stops AND the cancel button becomes disabled, while action buttons become enabled.
    2. Start a process that errors out quickly. Verify the cancel button becomes disabled and action buttons become enabled.
    3. Start a process and let it complete normally. Verify cancel button becomes disabled and action buttons become enabled.

## Issue 2: Research Button Unresponsive After Click
-   **Observation:** User reports the 'Research and Summarize' button activates, but clicking it immediately turns it grey (disabled) and produces no output or response.
-   **Files to Check:**
    -   `main.ts`: `NotemdSidebarView.onOpen` - `onclick` handler for the 'Research & Summarize' button, `updateButtonStates`.
    -   `main.ts`: `researchAndSummarize` function.
    -   `main.ts`: `_performResearch` function.
    -   `main.ts`: `isBusy` flag usage.
    -   `main.ts`: `getReporter` function.
-   **Investigation Steps & Findings:**
    1.  ✅ User confirms clicking the *sidebar button*. (Implied)
    2.  ✅ Button activation on file open works. (Confirmed)
    3.  ✅ Immediate grey-out is expected: `onclick` disables button, `finally` re-enables. (Confirmed)
    4.  ❓ Investigate lack of output/response:
        *   Is `plugin.isBusy` already `true` when clicked? (Add logging to check).
        *   ✅ Check for empty selection (`topic.trim() === ''`) handled? (Fix previously applied - 2025-04-24).
        *   **NEW:** Are there other early exits in `researchAndSummarize` *before* logging/notices (e.g., error getting editor/view)?
        *   **NEW:** Is `getReporter()` returning the correct sidebar instance?
        *   **NEW:** Is there an unhandled promise rejection or a `catch` block in `researchAndSummarize` or `_performResearch` that fails to show a `Notice` or log to the reporter? Check API key errors, network errors, content fetching errors.
        *   **NEW:** Does the `finally` block in the `onclick` handler reliably call `updateButtonStates()`?
-   **Potential Improvements/Checks:**
    1.  ✅ [COMPLETED - 2025-04-24] Added check for empty topic.
    2.  ✅ [COMPLETED - 2025-04-24] Added more logging. (May need more at very start).
    3.  ✅ [COMPLETED - 2025-04-24] Ensured `finally` block resets state. (Needs re-verification).
    4.  ✅ [COMPLETED - 2025-04-24] Added logging at the very beginning of the research button's `onclick` handler and `researchAndSummarize` to check `isBusy` state and confirm execution entry.
    5.  ✅ [COMPLETED - 2025-04-24] Explicitly added `reporter.log` or `new Notice` calls within `catch` blocks in `researchAndSummarize` and `_performResearch` for better error reporting.
-   **Status:** [READY FOR TESTING] Code changes for logging and error reporting are complete.
-   **Testing:**
    1. Test without selecting text (should show notice).
    2. Test with selected text (should start processing).
    3. Test with invalid API keys (Tavily/LLM) or network disconnected (should show error notice/log).
    4. Test while another task is running (`isBusy` = true) (should show busy notice).
