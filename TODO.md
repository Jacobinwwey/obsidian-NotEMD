# Plan: Add "No Auto Translation" Option and Integrate into Task Logic

Goal: Add a global “No auto translation” option so that, when enabled, all tasks **except** the explicit “Translate” task stop forcing outputs into a target language or performing automatic translation. This prevents misalignment between multilingual source corpora and generated outputs, while preserving the existing Translate task behavior.

---

## 1. Requirements & Behavior

1. Introduce a global boolean setting, e.g. `disableAutoTranslation`:
   - `true`: Forbid automatic translation for all tasks except the explicit “Translate” task.
   - `false`: Keep current behavior (tasks may enforce output language or post-translate results according to settings).

2. The explicit **Translate** task must:
   - Always perform translation as configured.
   - Ignore `disableAutoTranslation` (i.e., this switch does not weaken the Translate feature).

3. For all other tasks that currently depend on language configuration — including but not limited to:
   - Add Links (Process File/Folder)
   - Research & Summarize
   - Generate from Title
   - Summarise as Mermaid diagram
   - Extract Concepts
   - Any other LLM-based processing that sets/normalizes output language
   behavior should be:

   - When `disableAutoTranslation = true`:
     - Do not force “output must be in language X” in prompts.
     - Do not perform secondary translation passes to normalize language.
     - Let the LLM operate in the original / natural language context (or model default), preserving multilingual structure.
   - When `disableAutoTranslation = false`:
     - Preserve existing behavior:
       - Use global “Output language” or task-specific language settings.
       - Apply any current prompt-level or post-processing translation logic.

4. Backwards compatibility:
   - Default value must keep existing semantics (`disableAutoTranslation = false`).
   - Existing users see no behavior change until they explicitly enable the option.

---

## 2. Settings Model Changes

### 2.1 Add to `NotemdSettings` (src/types.ts)

Add a dedicated field to control auto translation:

```ts
export interface NotemdSettings {
  // ...existing fields...

  // Language / translation behavior
  disableAutoTranslation: boolean; // true => only explicit "Translate" task performs translation
}
```

### 2.2 Default Value (src/constants.ts)

In `DEFAULT_SETTINGS`, provide a default that preserves current behavior:

```ts
export const DEFAULT_SETTINGS: NotemdSettings = {
  // ...existing defaults...
  disableAutoTranslation: false,
};
```

This ensures older configs load safely without breakage.

---

## 3. Settings UI: Add Toggle in NotemdSettingTab

Location: `src/ui/NotemdSettingTab.ts`, inside the “Language settings” section.

Add a new toggle near the Output language and per-task language options:

- Name: `Disable auto translation (except for "Translate" task)`
- Description (example):
  - `When enabled: Non-Translate tasks will no longer force outputs into a specific language or auto-translate results. Only the "Translate" task will perform translation.`

Pseudo-implementation:

```ts
new Setting(containerEl)
  .setName('Disable auto translation (except for "Translate" task)')
  .setDesc(
    'On: Non-Translate tasks do not force a target language or auto-translate outputs. ' +
    'The explicit "Translate" task still performs translation as configured.'
  )
  .addToggle(toggle =>
    toggle
      .setValue(this.plugin.settings.disableAutoTranslation)
      .onChange(async (value) => {
        this.plugin.settings.disableAutoTranslation = value;
        await this.plugin.saveSettings();
      })
  );
```

Key points:

- Scope is clearly documented: applies to all tasks except the explicit Translate task.
- No breaking of existing workflows until user opts in.

---

## 4. Integration into Task Execution Logic

Objective: Centralize and respect `disableAutoTranslation` wherever language constraints or translation calls are applied.

### 4.1 Task Key Awareness

`TaskKey` already includes `'translate'`:

```ts
export type TaskKey =
  | 'addLinks'
  | 'generateTitle'
  | 'researchSummarize'
  | 'translate'
  | 'summarizeToMermaid'
  | 'extractConcepts';
```

Use `taskKey` to distinguish behavior:

- If `taskKey === 'translate'`:
  - Always allow/perform translation.
- If `taskKey !== 'translate'`:
  - Behavior depends on `disableAutoTranslation`.

### 4.2 Prompt Construction Adjustments

Where prompts are built (e.g. `src/promptUtils.ts` or similar):

1. Ensure builders receive:
   - `taskKey: TaskKey`
   - `settings: NotemdSettings`
   - (Optionally) `targetLanguage` if applicable.

2. Apply logic:

```ts
const shouldForceLanguage =
  taskKey === 'translate' || !settings.disableAutoTranslation;

if (shouldForceLanguage && targetLanguage) {
  prompt += `\nPlease respond in ${resolveLanguageLabel(targetLanguage)}.`;
} else {
  // Do not add a forced language requirement for non-Translate tasks
}
```

Notes:

- `resolveLanguageLabel` represents the existing mapping from code to readable label if present.
- For non-Translate tasks and `disableAutoTranslation = true`, prompts become language-neutral or context-driven, not language-enforcing.

### 4.3 Output Post-Processing / Secondary Translation

If any non-Translate task currently:

- Calls a helper like `translate(...)` or
- Normalizes outputs into the global/task-specific language after LLM generation,

then guard those calls:

```ts
const shouldPostTranslate =
  taskKey === 'translate' || !settings.disableAutoTranslation;

let finalOutput = llmOutput;

if (shouldPostTranslate && needsNormalization) {
  finalOutput = await translateToTargetLanguage(...);
}
```

Rules:

- For `taskKey === 'translate'`:
  - Always run the translation pipeline as designed.
- For other tasks:
  - Only run translation/normalization when `disableAutoTranslation` is `false`.
  - When `true`, keep `llmOutput` as-is (no extra translation step).

### 4.4 Centralization

Prefer a centralized utility (e.g. in `llmUtils.ts` / `promptUtils.ts`) to determine:

- Whether to apply language clauses to prompts.
- Whether to perform post-translation.

This avoids scattering conditional logic and reduces risk of missing a call site.

---

## 5. Affected Areas (Audit Checklist)

Review and adjust (non-exhaustive; based on repo structure):

1. `src/main.ts`
   - Confirm each command invocation has an associated `taskKey`.
   - Ensure Translate-related commands are marked with `'translate'`.

2. `src/promptUtils.ts`
   - Update prompt builders to accept `taskKey` and `settings`.
   - Apply `disableAutoTranslation` logic when composing language instructions.

3. `src/llmUtils.ts` / `src/translators/*`
   - Wrap any automatic translation or enforced language behavior with checks as described.
   - Ensure Translate task remains fully functional.

4. Any per-task language usage:
   - Add Links language
   - Research & summarize language
   - Summarise as Mermaid language
   - Extract Concepts language
   - Generate Title language
   - Ensure they are only enforced when:
     - `disableAutoTranslation = false`, or
     - Task is `translate`.

---

## 6. Testing Plan

Add or update tests (e.g. under `src/tests`) to validate:

1. **Default behavior (backward compatibility)**:
   - `disableAutoTranslation = false`
   - Non-Translate tasks:
     - Still enforce the configured output language where expected.
     - Any existing translation/normalization behavior remains unchanged.
   - Translate task:
     - Works as before.

2. **Auto translation disabled**:
   - `disableAutoTranslation = true`
   - For non-Translate tasks:
     - Prompts do not include “respond in X language” constraints.
     - No secondary translation helper is invoked.
     - Outputs remain in the model’s natural/original language, preserving mixed-language corpora.
   - For Translate task:
     - Still performs translation according to its configuration.
     - Ignores `disableAutoTranslation`.

3. **Multilingual corpus scenario**:
   - With `disableAutoTranslation = true`, verify:
     - Per-note or per-chunk outputs are not forced into one language.
     - Source/target alignment is preserved for analysis workflows.

4. **Configuration persistence**:
   - Toggling the new setting in the UI updates and persists `NotemdSettings.disableAutoTranslation`.
   - No runtime errors when loading old configs without the new field (default applied correctly).

---

## 7. Expected Outcome

After implementation:

- Users working with multilingual corpora can enable “No auto translation” to:
  - Prevent unintended language normalization.
  - Keep outputs aligned with original languages across all non-Translate tasks.
- The dedicated Translate task:
  - Continues to provide explicit translation functionality.
- Behavior is:
  - Backward compatible by default,
  - Explicitly documented in settings,
  - Centralized and consistent across the codebase.
