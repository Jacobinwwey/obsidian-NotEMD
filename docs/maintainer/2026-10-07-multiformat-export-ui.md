# Multi-format export UI

[简体中文](./2026-10-07-multiformat-export-ui.zh-CN.md)

### Root cause and implementation

The preview menu coupled choosing a format with immediately starting that one export. The presentation sidebar used native `select multiple`, so normal clicks replaced earlier choices unless the user knew the modifier-key convention. The backend already accepted format arrays.

The preview now chooses formats and destination once. The existing artifact writers export all selected formats without new generation or API calls. Whole-preview and single-panel scopes remain separate; PPI, PNG companion files, history and failure continuation are preserved. A shared in-flight guard blocks duplicate clicks, progress names the current format, and the last batch notice includes earlier failures. The sidebar uses labeled checkboxes and explains why the final remaining choice cannot be cleared.

### Fast Gate Failures

No failures in the 10 measured fast checks. The local law-audit score is 79.47/100 with 8 unknown principle checks; this is not a strict release-gate pass. Evidence: `.cache/multiformat-ux-evidence.json`, `.cache/multiformat-ux-audit.json` and `.cache/multiformat-ui/after-report.json`.

### Law Diagnosis

- Jakob/Hick: hidden modifier-key selection and immediate single-format menu actions made multiple selection hard to discover. Visible checkbox groups and one confirmation now match the task.
- Fitts: measured choice and dialog action targets are at least 44px. Pointer/thumb reach was not measured and remains unknown.
- Goal-Gradient/Peak-End: disabled controls alone did not explain ongoing exports, and a later successful format could obscure an earlier failure. Current-format/progress labels and the final batch summary address both issues.
- Doherty: 20 headless-fixture change-event-to-next-frame samples gave p95 17.2ms. This is a local interaction measurement, not production export latency.

### Priority Fix Plan

- P1 completed: multi-format selection in preview and sidebar; once-only destination confirmation; empty-selection feedback; batch failure summary; progress and duplicate-submit protection.
- P2 verification gaps: physical reach, spacing-ratio measurement, continuity/closure cues, motion grouping, isolated emphasis, interrupted-task resume and a user-study simplicity score remain unmeasured. No invented values were supplied to the audit.

### Recheck Checklist

- 315-suite full run: 3061 passed, one skipped. Final targeted tests after adding the progress label: 80 passed.
- Fresh build, lint ratchet (17 changed TS files, zero regressions), UI-string/render-host audits and diff hygiene pass.
- Headless checks: ordinary multiple clicks, keyboard Space/focus, empty selection, one SVG+PDF confirmation, 375/1000px light/dark layouts without horizontal overflow.
- Native Obsidian CLI in both the acceptance vault and 1Knowledge: checked SVG+PNG+PDF, confirmed once, and verified all three output signatures. Sidebar retained HTML+PDF+PPTX. Original settings were restored byte-for-byte. Receipts: `.cache/native-multiformat-*.json`.
- This continuation also retains independent PDF page viewports: acceptance 32/32 and 1Knowledge 36/36, with independent zoom/lock and cleanup.

Design followed the invoked frontend-design, frontend-law-auditor and ui-ux-pro-max guidance while preserving the existing Obsidian theme. The local ui-ux-pro-max search script was absent; its readable design guidance was used without downloading replacements. All translations were directly authored, with no translation API. Work and verification used CLI only. The local installed build is updated; published 1.9.13 assets are unchanged.
