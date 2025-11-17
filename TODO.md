## Feasibility Analysis: High (Fully Implementable)

After deeply analyzing the codebase (main.ts, types.ts, fileUtils.ts, and code definitions), the requested feature is **highly feasible** with minimal changes. Obsidian's Editor API perfectly supports text selection/replacement, file creation, and command integration. Existing functions like `createConceptNotes`, `generateContentForTitle`, and `normalizeNameForFilePath` can be reused/extended.

### Key Insights from Code
- **Editor Selection**: Commands use `editorCallback: async (editor: Editor, view: MarkdownView) => {}` – provides `editor.getSelection()` for word, `editor.replaceSelection('[[word]]')` for wiki-link, `view.file` for current file.
- **File Creation**: `createConceptNotes` already creates blank `word.md` in `settings.conceptNoteFolder` with `# word` header + optional backlink.
- **Auto-Generate**: `generateContentForTitle(app, settings, newFile, reporter)` reads title, calls LLM (with optional research), overwrites with content, applies Mermaid/LaTeX cleanup.
- **Settings**: `conceptNoteFolder` configurable (via NotemdSettingTab). Defaults/fallbacks exist.
- **Progress**: Uses `ProgressReporter` (modal/sidebar). Can use `plugin.getReporter()`.
- **Busy State**: `plugin.isBusy` prevents overlaps.
- **Hotkeys**: User assigns via Obsidian Settings > Hotkeys (search command ID). No code needed.
- **Edge Cases Handled**: Normalization, duplicates, exists (add backlink), cancellation, errors.

No major refactors needed. ~50-80 LOC addition.

### Detailed Implementation Plan
1. **[x] Add New Command in `main.ts` (onload())**
   ```
   this.addCommand({
     id: 'create-wiki-link-and-generate-from-selection',
     name: 'Create Wiki-Link & Generate Note from Selection',
     editorCallback: async (editor: Editor, view: MarkdownView) => {
       // Implementation below
     },
   });
   ```

2. **Command Logic (editorCallback)**
   ```typescript
   const word = editor.getSelection().trim();
   if (!word || word.length < 2) {
     new Notice('Select a valid word (2+ chars).');
     return;
   }

   // Replace selection with wiki-link
   editor.replaceSelection(`[[${word}]]`);

   if (!this.settings.useCustomConceptNoteFolder || !this.settings.conceptNoteFolder) {
     new Notice('Set Concept Note Folder in settings.');
     return;
   }

   const safeName = normalizeNameForFilePath(word);
   const notePath = `${this.settings.conceptNoteFolder}/${safeName}.md`;
   const existingFile = this.app.vault.getAbstractFileByPath(notePath);

   let newFile: TFile;
   const reporter = this.getReporter();

   try {
     if (existingFile instanceof TFile) {
       // Add backlink to existing (reuse createConceptNotes logic)
       await createConceptNotes(this.app, this.settings, new Set([word]), view.file?.basename, { disableBacklink: false });
       newFile = existingFile;
       reporter.log(`Updated existing note: ${notePath}`);
     } else {
       // Create blank note (reuse createConceptNotes minimal template)
       await createConceptNotes(this.app, this.settings, new Set([word]), view.file?.basename, { minimalTemplate: false });
       newFile = this.app.vault.getAbstractFileByPath(notePath) as TFile;
       reporter.log(`Created blank note: ${notePath}`);
     }

     // Auto-run Generate from Title
     if (this.isBusy) throw new Error('Busy');
     this.isBusy = true;
     await generateContentForTitle(this.app, this.settings, newFile, reporter);
     new Notice(`Generated content for [[${word}]]!`);
   } catch (error) {
     new Notice(`Error: ${error.message}`);
     reporter.log(`Error: ${error.message}`);
   } finally {
     this.isBusy = false;
   }
   ```

3. **Imports Needed** (add to main.ts):
   ```typescript
   import { normalizeNameForFilePath, createConceptNotes, generateContentForTitle } from './fileUtils';
   import { ProgressReporter } from './types';
   ```

4. **Enhancements (Optional)**
   - Setting: `quickGenerateFolder` (default to `conceptNoteFolder`).
   - Toggle: Skip generation if file exists.
   - Backlink: Always add `[[current-file]]` to new/existing note.
   - Hotkey Suggestion: Cmd/Ctrl+Shift+W.

5. **Testing Steps**
   - Select word → Hotkey → Verify: link replaced, file created in folder, content generated (LLM-based doc).
   - Existing file: Adds backlink, regenerates.
   - No folder: Notice.
   - Busy: Blocks.

6. **Risks/Mitigations**
   - LLM Cost: Single call, user-initiated.
   - Conflicts: Uses existing duplicate handling.
   - Permissions: Vault ops standard.

## Feasibility Analysis: High (Already Partially Implemented, Easy Extension)

After analyzing `main.ts`, `mermaidProcessor.ts`, and `fileUtils.ts`, the feature is **highly feasible** (~30-50 LOC addition). The core Mermaid/LaTeX cleanup logic (`refineMermaidBlocks` + `cleanupLatexDelimiters`) is already **automatically applied** in `generateContentForTitle` (used by all three target commands) and `processFile`. "Batch Mermaid fix" (`batchFixMermaidSyntaxInFolder`) is a thin wrapper: loops MD files in a folder, applies the same cleanup funcs, saves if changed.

### Key Insights
- **Target Commands**:
  | Command | ID | Processed Files/Folders | Current Cleanup |
  |---------|----|-------------------------|-----------------|
  | Generate from title | `generate-content-from-title` | Single active MD file | ✅ Already in `generateContentForTitle` |
  | Batch generate from titles | `batch-generate-content-from-titles` | All eligible MDs in selected folder (moved to `{folder}_complete`) | ✅ Per-file via `generateContentForTitle` |
  | Create Wiki-Link & Generate Note from Selection | `create-wiki-link-and-generate-from-selection` | New/existing note in `settings.conceptNoteFolder` | ✅ Via `generateContentForTitle` on note |

- **Batch Mermaid Fix**: `batchMermaidFixCommand` → `batchFixMermaidSyntaxInFolder(folderPath)`: Serial loop over folder MDs, cleanup, modify if changed. No parallelism.
- **Redundancy**: Post-LLM cleanup already happens, so "auto Batch fix" is redundant but harmless (idempotent ops). User may want explicit/full-folder re-fix for safety.
- **Busy State**: All commands respect `plugin.isBusy` → no overlaps.
- **Progress**: Reuses `ProgressReporter`.
- **Edge Cases**: Vault locks, cancellations, no-change skips handled.

**Risks**: Minimal (atomic file ops). LLM-generated Mermaid may need extra pass if complex.

### Detailed Implementation Plan
1. **[ ] Extract Single-File Fix Function** (`fileUtils.ts`):
   ```typescript
   export async function fixMermaidSyntaxInFile(app: App, file: TFile, reporter: ProgressReporter): Promise<boolean> {
     const content = await app.vault.read(file);
     let fixed = cleanupLatexDelimiters(content);
     fixed = refineMermaidBlocks(fixed);
     if (fixed.trim() !== content.trim()) {
       await app.vault.modify(file, fixed);
       reporter.log(`Fixed: ${file.name}`);
       return true;
     }
     return false;
   }
   ```
   - Reuse in `batchFixMermaidSyntaxInFolder` (loop calls it).

2. **[ ] Modify `generateContentForTitle`** (fileUtils.ts, optional toggle):
   ```typescript
   // After existing cleanup:
   if (settings.autoMermaidFixAfterGenerate) {
     await fixMermaidSyntaxInFile(app, file, progressReporter); // Explicit second pass
   }
   ```

3. **[ ] Hook Targets**:
   - **Single Generate**: Already covered. Add explicit `fixMermaidSyntaxInFile` post-call in `generateContentForTitleCommand`.
   - **Selection Command** (main.ts): Already calls `generateContentForTitle`. Add:
     ```typescript
     // After await generateContentForTitle:
     await fixMermaidSyntaxInFile(this.app, newFile, reporter);
     ```
   - **Batch Generate** (`batchGenerateContentForTitlesCommand`): After loop/all files:
     ```typescript
     // Re-fix entire original folder (safety):
     await batchFixMermaidSyntaxInFolder(app, folderPath, reporter);
     ```

4. **[ ] Add Setting** (NotemdSettingTab.ts):
   ```typescript
   new Setting(parent).settingEl.addClass('auto-mermaid-fix').setName('Auto Mermaid Fix').setDesc('Run Batch Mermaid fix after generation tasks.').addToggle(cb => cb.onChange(v => settings.autoMermaidFixAfterGenerate = v));
   ```

5. **[ ] Update TODO.md**: Append this full analysis/plan as new section.

6. **Testing**:
   - Generate single → Verify cleanup twice (idempotent).
   - Batch → Folder re-fixed post-move.
   - Selection → Concept note fixed.
   - Toggle off → Only once.

**Code Improvements**:
- **Parallelism**: Add optional parallelism to `batchFixMermaidSyntaxInFolder` (like batch gen).
- **Toggle**: Setting to enable/disable auto-fix.
- **Target Folder**: For batch gen, fix `{folder}_complete` instead/original.
- **Idempotency**: Already safe.


## 深度代码分析：并发延迟问题原因

### 问题复现与症状确认
- **用户设置**：`enableBatchParallelism=true`，`batchConcurrency=N>1`，`apiCallIntervalMs>0`，`batchSize>=N`。
- **实际行为**：同一batch内前N个文件（N=concurrency）的API调用**同时爆发**（burst），无延迟间隔，导致API rate limit 429错误。
- **证据**：测试或运行时，日志显示batch启动后立即多个LLM调用并发，无staggering。

### 核心原因剖析
问题出在 **`src/utils.ts` 中的 `createConcurrentProcessor`** 与 **batch处理逻辑**（`src/fileUtils.ts` 的 `batchGenerateContentForTitles`、`batchFixMermaidSyntaxInFolder`，及 `src/main.ts` 的重复逻辑）结合使用时：

1. **Semaphore机制（并发控制）**：
   ```
   class Semaphore {
     async acquire(): Promise<() => void> {  // 简单计数器+队列
       if (this.active < this.concurrency) { this.active++; resolve(release); }
       else { queue.push(release); }
     }
   }
   ```
   - 正确限制**同时active任务数 <= concurrency**。
   - 但**允许burst**：首次N任务的`acquire()`**瞬间成功**（active从0→N）。

2. **任务启动流程（createConcurrentProcessor）**：
   ```
   async (tasks): Promise<Array<Result>> => {
     const results = [];  // 同步for循环
     for (const task of tasks) {
       const p = semaphore.acquire().then(release => {  // p1~pN 瞬间创建&pending
         updateActive(1);
         return delayedExecution(task, apiCallIntervalMs)  // 每个独立delay
           .finally(() => { updateActive(-1); release(); });
       });
       results.push(p);  // 所有promise瞬间入队
     }
     return Promise.all(results);  // 所有任务**同时启动**delayedExecution
   }
   ```
   - **关键缺陷**：`for`循环**同步**，batch大小>=concurrency时，前N任务的promise**瞬间创建并resolve acquire** → **所有delayedExecution同时开始**。
   - `Promise.all`不阻塞启动，所有任务**并行执行pre-delay**。

3. **delayedExecution（间隔延迟）**：
   ```
   async delayedExecution(fn, intervalMs) {
     if (intervalMs > 0) await delay(intervalMs);  // PRE: 所有并行delay(interval) → 同时结束
     const result = await fn();  // API调用 → **同时爆发**
     if (intervalMs > 0) await delay(intervalMs);  // POST: 同时
   }
   ```
   - 每个任务独立pad前后delay，但**启动同步** → pre-delay并行 → **API调用时间点重合**。
   - 无**启动staggering**（任务间启动延迟）。

4. **Batch整体流程**（fileUtils.ts 等）：
   ```
   const fileBatches = chunkArray(files, batchSize);  // batchSize>=concurrency
   for (let b=0; b<fileBatches.length; b++) {
     const batch = fileBatches[b];
     const tasks = batch.map(file => async () => generateContentForTitle(...));  // 每个task=1 LLM call
     const results = await processor(tasks);  // 上述问题发生
     if (b < last) await delay(batchInterDelayMs);  // batch间延迟OK
   }
   ```
   - **batchInterDelayMs**：batch间正常。
   - **intra-batch**：无stagger → burst。
   - `generateContentForTitle`：每个file**单LLM调用**，放大问题。

5. **测试问题**（src/tests/parallelBatch.test.ts）：
   - `jest.fn().mockResolvedValue(delay)`：mock同步，忽略真实timing → 未捕获burst。

6. **其他影响**：
   - `batchFixMermaidSyntaxInFolder`：无LLM，但若未来加，同样问题。
   - 代码重复：main.ts 有batchExtract逻辑，复制fileUtils → 维护隐患。

### 解决方案：精确修复 + 优化
#### 1. **核心修复：Staggered Launch in createConcurrentProcessor**（推荐，最小侵入）
   - **原理**：任务**启动时序延迟**（launch stagger），结合semaphore（concurrency）+delayedExecution（pad）。
   - **效果**：API调用间隔 ≈ `apiCallIntervalMs`（可调）。
   - **修改 src/utils.ts**：
     ```
     export function createConcurrentProcessor<T>(concurrency: number, apiCallIntervalMs: number, progressReporter: ProgressReporter) {
       const semaphore = new Semaphore(concurrency);
       return async (tasks: Array<() => Promise<T>>): Promise<Array<{ success: boolean; value?: T; error?: unknown }>> => {
         const results: Array<Promise<{ success: boolean; value?: T; error?: unknown }>> = [];
         for (let i = 0; i < tasks.length; i++) {  // 添加index
           if (i > 0) await delay(apiCallIntervalMs);  // **Stagger launch by interval**
           const p = semaphore.acquire().then(release => {
             progressReporter.updateActiveTasks(1);
             return delayedExecution(tasks[i], apiCallIntervalMs)
               .then(v => ({ success: true, value: v }))
               .catch(e => ({ success: false, error: e }))
               .finally(() => {
                 progressReporter.updateActiveTasks(-1);
                 release();
               });
           });
           results.push(p);
         }
         return Promise.all(results);
       };
     }
     ```
   - **行为**（interval=1000, concurrency=2, batch=3）：
     | t=0 | launch0: delay(1000) → API@1000 |
     | t=1000 | launch1: delay(1000) → API@2000 |
     | t=2000 | launch2: semaphore wait (if task0 done) + delay(1000) → API@3000 |
   - **优点**：简单、无新类、兼容现有、测试只需微调mock。

#### 2. **高级优化（可选，后续）**
   - **RateLimitedSemaphore**：全局`lastStartTime`，`acquire()`强制min interval between starts。
     ```
     class RateLimitedSemaphore {
       private lastStart = 0;
       constructor(concurrency: number, minIntervalMs: number) { ... }
       async acquire() {
         const now = Date.now();
         if (now - this.lastStart < this.minIntervalMs) await delay(this.minIntervalMs - (now - this.lastStart));
         this.lastStart = Date.now();
         // then semaphore.acquire()
       }
     }
     ```
     - 精确rate limit：max concurrency，同时strict interval between any starts。
   - **重构重复batch逻辑**：提取`batchProcessFiles(files, processorFn, settings)`到utils.ts，所有命令调用。
   - **测试增强**：parallelBatch.test.ts 加timing assert（jest.useFakeTimers），模拟真实delay。
   - **UI**：Sidebar显示activeTasks（已支持），加"API calls staggered" log。

#### 实施步骤（Act Mode Todo）
- [x] 分析确认问题（utils.ts, fileUtils.ts）
- [ ] 修复createConcurrentProcessor（stagger launch）
- [ ] 测试：更新parallelBatch.test.ts，run `npm test`
- [ ] 重构重复代码（main.ts → utils）
- [ ] 验证：browser或run batch，检查日志/timing无burst