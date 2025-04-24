# NoteMD Plugin - Testing & TODO List (Based on User Report)

## Issue: Batch Cancellation Button Greyed Out (Confirmed by Screenshot)
- **Observation:** User reports and screenshot confirms the 'Cancel Processing' button in the sidebar is consistently greyed out and cannot be clicked *during* the "Calling Provider" phase (e.g., "Calling Deepseek...") of the 'Batch Generate from Titles' task. It should remain enabled and clickable throughout the process.
- **Previous Attempts (Ineffective):**
    - Adding `await this.cancellableDelay(1, ...)` before API calls.
    - Adding `await delay(1);` inside the batch loop in `batchGenerateContentForTitles`.
    - Ensuring `cancelButton.disabled = false;` within `updateStatus` when `isProcessing` is true.
- **Files to Check:**
    - `main.ts`: `NotemdSidebarView` class - `onOpen` (batch button `onclick`), `requestCancel`, `updateStatus`, `updateButtonStates`.
    - `main.ts`: `NotemdPlugin.batchGenerateContentForTitles` function (loop structure).
    - `main.ts`: API call functions (`call*Api`) and `makeStableApiCall` (specifically around `requestUrl` or `fetch`).
    - `main.ts`: `ProgressReporter` interface and implementations.
- **REVISED HYPOTHESIS (Post-Testing):**
    *   **A) Persistent UI Blocking by Network Request:** The primary suspect remains that Obsidian's `requestUrl` (or potentially `fetch` if used directly) blocks the UI thread *during* the actual network communication, preventing the button's state update from rendering or click events from registering, even with small delays (`delay(1)`). The yield might not be effective enough during an active, blocking network I/O operation within Obsidian's event loop.
    *   **B) State Update Timing/Override:** The logic ensuring the button is enabled in `updateStatus` might be getting overridden by a subsequent call to `updateButtonStates` (perhaps in a `finally` block or elsewhere) before the UI thread gets a chance to repaint the button in its enabled state during the brief "Calling..." status update.
    *   **C) `AbortController` Ineffectiveness:** While unlikely, there might be an edge case where `requestUrl` doesn't fully respect the `AbortController` signal immediately or in a way that allows the UI to respond promptly.
-   **Potential Improvements/Checks (Round 2):**
    1.  **Isolate Network Blocking:** Temporarily replace the actual network call (`requestUrl(...)` or `fetch(...)`) inside the relevant API function (e.g., `callDeepSeekApi`) with a simple `await delay(5000);` (5 seconds).
        ```typescript
        // Inside callDeepSeekApi (or other relevant API function)
        try {
            progressReporter.updateStatus(`Calling ${provider.name}...`); // Ensure status updates
            console.log(`SIMULATING API CALL for 5 seconds...`);
            await delay(5000); // Simulate network delay WITHOUT actual network call
            console.log(`SIMULATION finished.`);
            // Comment out the actual requestUrl/fetch call
            // const response = await requestUrl(...);
            // ... rest of original success/error handling (maybe return dummy data) ...
            return "Simulated response";
        } catch (error) { ... }
        ```
        *   **Test:** Run the batch process. Is the 'Cancel' button clickable *during* this 5-second simulated call?
            *   If YES: This strongly confirms the actual network request (`requestUrl`/`fetch`) is the blocking culprit. Further investigation needed into non-blocking alternatives or better yielding strategies around `requestUrl`.
            *   If NO: The issue lies elsewhere, likely in the `updateButtonStates`/`updateStatus` logic or event loop handling within the batch process itself. Proceed to step 2.
    2.  **Trace Button State Updates:** Add detailed logging *immediately before and after* every call to `this.updateButtonStates()` within the batch processing loop (`batchGenerateContentForTitles`) and the single file processing functions it calls (`generateContentForTitle`, `processFile`, API calls). Also log the value of `this.cancelButton.disabled` within `updateStatus` *before and after* it's potentially modified.
        ```typescript
        // Example in NotemdSidebarView.updateButtonStates
        console.log('Entering updateButtonStates. isProcessing:', this.isProcessing);
        // ... existing logic ...
        console.log('Exiting updateButtonStates. Cancel button disabled:', this.cancelButton?.disabled);

        // Example in NotemdSidebarView.updateStatus
        console.log(`updateStatus: Received text "${text}". Current cancel disabled: ${this.cancelButton?.disabled}`);
        if (this.statusEl) this.statusEl.setText(text);
        if (this.cancelButton && this.isProcessing) {
             console.log(`updateStatus: Ensuring cancel button is enabled.`);
             this.cancelButton.disabled = false;
        }
        console.log(`updateStatus: Finished. Final cancel disabled: ${this.cancelButton?.disabled}`);
        // ... rest of progress bar logic ...

        // Example around calls in batchGenerateContentForTitles
        console.log('BATCH: Before updateButtonStates (start)');
        progressReporter.updateButtonStates();
        console.log('BATCH: After updateButtonStates (start)');
        // ... loop ...
        console.log('BATCH: Before updateButtonStates (finally)');
        progressReporter.updateButtonStates();
        console.log('BATCH: After updateButtonStates (finally)');
        ```
        *   **Test:** Run batch, observe console logs during the "Calling..." phase. Pinpoint exactly when and why `cancelButton.disabled` becomes `true`.
-   **Status:** [PENDING TESTING] Ready for implementing and testing Step 1 (Simulated Delay) first. If that doesn't reveal the cause, proceed to Step 2 (Detailed Logging).

## Issue: Research Button Unresponsive (Handler Fails Silently Before Logs)
-   **Observation:** User reports the 'Research and Summarize' button activates (becomes clickable when a file is open), but clicking it immediately turns it grey (disabled) and produces no output or response. **Crucially, console logs added *inside* the `onclick` handler in the previous attempt did *not* appear at all.**
-   **Previous Attempt (Ineffective):** Adding `console.log` statements at various points *inside* the `async () => { ... }` handler body.
-   **Files to Check:**
    -   `main.ts`: `NotemdSidebarView.onOpen` - Creation of `researchButton`, assignment of `onclick` handler (or `addEventListener`), and surrounding code.
    -   `main.ts`: `NotemdSidebarView.updateButtonStates` method.
-   **REVISED HYPOTHESIS (Post-Testing):** Since *no* logs from inside the handler appeared, the issue is likely occurring *before* the handler's code block even begins execution, or the handler assignment itself is failing silently.
    *   **A) Handler Assignment Failure:** An error might occur during the `researchButton.onclick = async () => { ... };` line itself in `onOpen`, preventing the handler from being attached correctly.
    *   **B) Invalid Button Reference:** The `researchButton` variable might be `null`, `undefined`, or pointing to a detached DOM element by the time `onOpen` tries to assign the handler.
    *   **C) Event Propagation/Conflict:** Another event listener (possibly higher up in the DOM or within Obsidian) might be capturing the click event and stopping its propagation before it reaches the intended handler.
    *   **D) Error in `onOpen` Before Handler:** An error could be happening elsewhere in the `NotemdSidebarView.onOpen` method *before* the `onclick` assignment line is even reached.
-   **Potential Improvements/Checks (Round 2):**
    1.  **Verify Handler Assignment & Button Validity (HIGHEST PRIORITY):**
        *   Add logging *immediately before and after* the `onclick` assignment in `NotemdSidebarView.onOpen`. Log the button element itself.
        ```typescript
        // Inside NotemdSidebarView.onOpen, around the researchButton setup
        const researchButton = container.createEl('button', { text: 'Research & Summarize', cls: 'mod-cta' });
        console.log('Research button element created:', researchButton); // Log the element

        try {
            console.log('Attempting to assign researchButton.onclick...');
            researchButton.onclick = async () => {
                console.log('Entering researchButton onclick handler'); // Keep this first line
                // ... rest of the original handler body ...
                this.log('Research button handler started.'); // Add log inside
                // ...
            };
            console.log('Successfully assigned researchButton.onclick.');
            if (typeof researchButton.onclick !== 'function') {
                 console.error('ERROR: researchButton.onclick is NOT a function after assignment!');
            }
        } catch (e) {
            console.error('Error during researchButton.onclick assignment:', e);
        }
        // ... rest of onOpen ...
        ```
    2.  **Use `addEventListener`:** If Step 1 shows assignment works but clicks still fail, try `addEventListener` as it can be more robust. Replace the `onclick` assignment with:
        ```typescript
        // Replace the researchButton.onclick = ... block with this:
        try {
            console.log('Attempting to add researchButton click listener...');
            researchButton.addEventListener('click', async () => {
                console.log('Entering researchButton click listener'); // New first log
                // ... rest of the original handler body ...
                 this.log('Research button listener triggered.'); // Add log inside
                // ...
            });
            console.log('Successfully added researchButton click listener.');
        } catch (e) {
            console.error('Error adding researchButton click listener:', e);
        }
        ```
    3.  **Wrap `onOpen` Content:** Add a `try...catch` block around the entire content of the `async onOpen()` method in `NotemdSidebarView` to catch any unexpected errors during the view's initialization that might prevent handlers from being set up correctly.
        ```typescript
        async onOpen() {
            console.log('NotemdSidebarView: onOpen started.');
            try {
                const container = this.contentEl;
                container.empty();
                container.createEl("h4", { text: "Original Processing" });
                // ... ALL existing button creation and handler assignments ...

                console.log('NotemdSidebarView: onOpen finished setup successfully.');
            } catch (error) {
                console.error('FATAL ERROR during NotemdSidebarView.onOpen:', error);
                new Notice('Error initializing Notemd sidebar view. Check console.');
            }
        }
        ```
    4.  **Minimal Handler Test:** If the above steps fail, reduce the handler to its absolute minimum to confirm if *any* click interaction is registered:
        ```typescript
        // Replace the onclick/addEventListener assignment with this:
        console.log('Assigning MINIMAL researchButton click handler...');
        researchButton.onclick = () => {
            console.log('MINIMAL researchButton onclick fired!');
            new Notice('Research button clicked!'); // Visual feedback
        };
        console.log('Assigned MINIMAL handler.');
        ```
-   **Status:** [PENDING TESTING] Ready for implementing and testing Step 1 (Verify Assignment) first. Based on the console output, proceed to Step 2, 3, or 4 as needed.
