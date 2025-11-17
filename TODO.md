## Action Plan: Fix Progress Bar Stuck at 95% in Wiki-Link Command

### Problem Analysis
**Issue**: Progress bar stuck at "Saving content..." (95%) after successful completion of "Create Wiki-Link & Generate Note from Selection". Log shows "Content generated successfully", but UI doesn't update to 100% or close modal.

**Root Cause** (from code review):
- `generateContentForTitle` (fileUtils.ts): `updateStatus('Saving content...', 95)` → `await vault.modify()` → `log success` → **no `updateStatus(..., 100)`**.
- Wiki command (main.ts): Calls `generateContentForTitle` → Notice → **no final status/modal close** (unlike `generateContentForTitleCommand` which has it).

### Feasibility & Improvements
**High Feasibility**: 4-6 lines. Ensures consistent UX across commands.

**Risks**: None (idempotent).

### Code Changes

1. **src/fileUtils.ts** - `generateContentForTitle` end:
```
------- SEARCH
    progressReporter.log(`Content generated successfully for ${file.name}.`);
=======
    progressReporter.log(`Content generated successfully for ${file.name}.`);
    progressReporter.updateStatus('Content generated successfully!', 100);
+++++++ REPLACE
```

2. **src/main.ts** - Wiki command `editorCallback` try block (after generateContentForTitle):
```
------- SEARCH
                    await generateContentForTitle(this.app, this.settings, newFile, reporter);

                    if (this.settings.autoMermaidFixAfterGenerate) {
                        reporter.log("Running automatic Mermaid syntax fix...");
                        await fixMermaidSyntaxInFile(this.app, newFile, reporter);
                    }
                    
                    new Notice(`Generated content for [[${word}]]!`);
=======
                    await generateContentForTitle(this.app, this.settings, newFile, reporter);

                    if (this.settings.autoMermaidFixAfterGenerate) {
                        reporter.log("Running automatic Mermaid syntax fix...");
                        await fixMermaidSyntaxInFile(this.app, newFile, reporter);
                    }

                    reporter.updateStatus('Wiki-Link & Generation complete!', 100);
                    if (reporter instanceof ProgressModal) {
                        setTimeout(() => reporter.close(), 2000);
                    }
                    
                    new Notice(`Generated content for [[${word}]]!`);
+++++++ REPLACE
```

### Testing
- Run wiki command: Verify 100%, auto-close modal.
- generateContentForTitleCommand: Already works, improved consistency.

**Post-Fix**: Progress reliable across features.
