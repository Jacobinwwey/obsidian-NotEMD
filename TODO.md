## Refined Plan: User-Configurable Parallel Batch Processing

### Key Enhancements Based on Feedback & Code Review
- **User Controls** (synced across settings/code):
  | Setting | Type | Default | UI | Purpose |
  |---------|------|---------|----|---------|
  | `enableBatchParallelism` | boolean | `false` | Toggle | Enable/disable parallelism (backward compat: serial by default). |
  | `batchConcurrency` | number | `1` | Slider (1-20) | Max parallel LLM calls (respects provider limits). |
  | `batchSize` | number | `50` | Slider (10-200) | Files per batch (balances memory/rates). |
  | `batchInterDelayMs` | number | `1000` | Slider (0-5000) | Delay between batches (ms, for rate limits). |
- **No External Deps**: Implement lightweight semaphore in `utils.ts` (no `p-limit` needed; use `queue` + `Promise`).
- **Backward Compat**: If `enableBatchParallelism=false` or `batchConcurrency=1`, behaves exactly as serial (no perf regression).
- **ProgressReporter Integration**: Extend interface for concurrency stats (e.g., `activeTasks: number`, `updateActiveTasks(+1/-1)` atomic).
- **Provider Awareness**: In `llmUtils.ts`, add per-provider `recommendedConcurrency` (e.g., OpenAI:5, Ollama:10, LMStudio:∞).
- **Error/Resilience**: Exponential backoff retry (3x), `AbortController` per task, aggregate errors per batch.
- **Code Locations** (minimal changes):
  - `constants.ts`: Add to `DEFAULT_SETTINGS`.
  - `types.ts`: Extend `NotemdSettings`.
  - `ui/NotemdSettingTab.ts`: Add UI sliders/toggle.
  - `utils.ts`: Semaphore + chunkArray + retry.
  - `fileUtils.ts` / `main.ts`: Refactor batch fns to use new processor.

### Step-by-Step Implementation (Prioritized)
1. **[Settings Sync]** Update `constants.ts` / `types.ts` / `NotemdSettingTab.ts`.
2. **[Utils]** Add semaphore, chunkArray, retry in `utils.ts`.
3. **[ProgressReporter]** Extend `types.ts` + impl in `ProgressModal.ts` / `NotemdSidebarView.ts`.
4. **[Core Refactor]** Parallelize `batchGenerateContentForTitles`, `processFolderWithNotemdCommand`, `batchExtractConceptsForFolderCommand`.
5. **[Provider Tweaks]** Optional `llmUtils.ts` caps.
6. **Tests**: Add to existing test suites.

### Detailed Code Changes

#### 1. Settings (`constants.ts`)
```ts
export const DEFAULT_SETTINGS: NotemdSettings = {
  // ... existing ...
  enableBatchParallelism: false,
  batchConcurrency: 1,
  batchSize: 50,
  batchInterDelayMs: 1000,
};
```

#### 2. Types (`types.ts`)
```ts
export interface NotemdSettings {
  // ... existing ...
  enableBatchParallelism: boolean;
  batchConcurrency: number;
  batchSize: number;
  batchInterDelayMs: number;
}

export interface ProgressReporter {
  // ... existing ...
  activeTasks: number; // NEW: For concurrency display
  updateActiveTasks(delta: number): void; // NEW
}
```

#### 3. UI (`ui/NotemdSettingTab.ts`)
```ts
// In display() or relevant section
new Setting(parent)
  .setName('Enable Batch Parallelism')
  .setDesc('Allow parallel LLM calls for faster batch processing.')
  .addToggle(t => t
    .setValue(this.plugin.settings.enableBatchParallelism)
    .onChange(async (v) => {
      this.plugin.settings.enableBatchParallelism = v;
      await this.plugin.saveSettings();
    }));

new Setting(parent)
  .setName('Batch Concurrency')
  .setDesc('Max parallel LLM calls (1=serial). Respect API limits!')
  .addSlider(s => s
    .setLimits(1, 20)
    .setValue(this.plugin.settings.batchConcurrency)
    .setDynamicTooltip()
    .onChange(async (v) => {
      this.plugin.settings.batchConcurrency = Math.floor(v);
      await this.plugin.saveSettings();
    }));

// Similarly for batchSize (10-200), batchInterDelayMs (0-5000)
```

#### 4. Utils (`utils.ts`) - Semaphore (no deps)
```ts
// Lightweight semaphore
export class Semaphore {
  private queue: Array<() => void> = [];
  private active = 0;
  constructor(private concurrency: number) {}

  async acquire(): Promise<() => void> {
    return new Promise(resolve => {
      const release = () => {
        this.active--;
        const next = this.queue.shift();
        next?.();
      };
      if (this.active < this.concurrency) {
        this.active++;
        resolve(release);
      } else {
        this.queue.push(release);
      }
    });
  }
}

export function createConcurrentProcessor(concurrency: number) {
  const semaphore = new Semaphore(concurrency);
  return async <T>(tasks: Array<() => Promise<T>>): Promise<Array<{success: boolean; value?: T; error?: unknown}>> => {
    const results: Array<PromiseSettledResult<{success: boolean; value?: T; error?: unknown}>> = [];
    for (const task of tasks) {
      const release = await semaphore.acquire();
      const p = task().then(v => ({success: true, value: v})).catch(e => ({success: false, error: e})).finally(release);
      results.push(p);
    }
    return Promise.all(results).then(r => r.map(rr => rr.status === 'fulfilled' ? rr.value! : {success: false, error: rr.reason}));
  };
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  return arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, [] as T[][]);
}

export async function retry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } catch (e) {
      if (i === maxRetries - 1) throw e;
      await delay(delayMs * Math.pow(2, i)); // Exponential backoff
    }
  }
  throw new Error('Retry exhausted');
}
```

#### 5. ProgressReporter Impl (e.g., `ui/ProgressModal.ts`)
```ts
// Add to class
activeTasks = 0;
updateActiveTasks(delta: number) { this.activeTasks += delta; this.updateStatus(`Active: ${this.activeTasks}`); }

// Usage in batch: reporter.updateActiveTasks(1); ... finally { reporter.updateActiveTasks(-1); }
```

#### 6. Batch Refactor Example (`fileUtils.ts` - `batchGenerateContentForTitles`)
```ts
export async function batchGenerateContentForTitles(app: App, settings: NotemdSettings, folderPath: string, progressReporter: ProgressReporter) {
  // ... existing file filtering/setup ...
  if (!settings.enableBatchParallelism || settings.batchConcurrency <= 1) {
    // Serial fallback (existing loop)
    for (...) { await generateContentForTitle(...); }
    return { errors: [] };
  }

  const concurrency = Math.min(settings.batchConcurrency, 20); // Cap
  const processor = createConcurrentProcessor(concurrency);
  const fileBatches = chunkArray(filesToProcess, settings.batchSize);

  let allErrors: {file: string; message: string}[] = [];
  for (let b = 0; b < fileBatches.length; b++) {
    const batch = fileBatches[b];
    progressReporter.log(`Processing batch ${b+1}/${fileBatches.length} (${batch.length} files)`);
    if (progressReporter.cancelled) break;

    const tasks = batch.map(file => () => {
      progressReporter.updateActiveTasks(1);
      return retry(async () => {
        const content = await generateContentForTitle(app, settings, file, progressReporter);
        // Move/save immediately after LLM (still serial per result, but parallel LLM)
        await moveProcessedFile(file, content); // Existing logic
        return { file, success: true };
      }, 3);
    });

    const results = await processor(tasks);
    allErrors.push(...results.filter(r => !r.success).map(r => ({file: r.file.name, message: String(r.error)})));

    // Cleanup active
    batch.forEach(() => progressReporter.updateActiveTasks(-1));
    await delay(settings.batchInterDelayMs);
  }
  return { errors: allErrors };
}
```
- **Apply similarly** to other batches: Serialize I/O post-LLM, parallel only network-bound parts.
- **Per-task Abort**: Pass `progressReporter.abortController.signal` to LLM calls.

### Validation & Testing
- **Edge**: concurrency=1 → identical to current.
- **Perf**: Local LLM → concurrency=10+.
- **Rates**: OpenAI → cap at 5, interDelay=2000ms.
- **Tests**: Add `tests/parallelBatch.test.ts` mocking vault/LLM.
