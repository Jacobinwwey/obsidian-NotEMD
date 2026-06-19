# Slidev Standalone Acceptance, 2026-06-18

Language: **English** | [简体中文](./slidev-standalone-acceptance-2026-06-18.zh-CN.md)

This file records the real standalone acceptance for the `architecture.zh-CN.md` export. It exists because the generated HTML and screenshots are inspection artifacts, not good main-branch source artifacts.

## Verdict

Accepted for the maintainer verifier path at commit `e46eb60`:

```text
fix(slidev-export): gate native standalone html
```

The acceptance claim is narrow:

1. the real source was `docs/architecture.zh-CN.md`;
2. the workflow used Jacob's local Slidev fork;
3. the workflow loaded the full Slidev skill directory, including references;
4. strict native standalone passed, not only server-script compatibility;
5. the full generated deck passed rendered-layout audit with zero overflow and zero unreadable findings.

It is not a claim that every future custom Slidev component layout is automatically safe.

## Why The Files Were Not Visible On Main

The real output was archived outside the repo:

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/
```

That avoided committing one-off generated files to `main`, especially:

```text
final-output/architecture.zh-CN-slides/index-standalone.html
final-output/architecture.zh-CN-slides/slide-01-workflow.png
...
final-output/architecture.zh-CN-slides/slide-28-workflow.png
```

The missing piece was this repository-tracked acceptance index. Without it, the code and maintainer docs contained the rules and summary, but there was no dedicated file that pointed to the concrete strict report and archived output.

## Acceptance Evidence

Strict report:

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/completion-rerun-strict-report.json
```

Inspectible standalone HTML:

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/final-output/architecture.zh-CN-slides/index-standalone.html
```

Prepared Slidev source:

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/final-output/_slidev-sources/architecture.zh-CN.slidev.md
```

Machine-readable summary from the strict report:

```json
{
  "ok": true,
  "source": {
    "vaultRoot": "/home/jacob/obsidian-NotEMD/docs",
    "sourcePath": "architecture.zh-CN.md"
  },
  "slidev": "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)",
  "skillRootPath": "/home/jacob/slidev/skills/slidev",
  "skillReferenceCount": 52,
  "output": {
    "format": "html",
    "path": "/home/jacob/obsidian-NotEMD/docs/export/architecture.zh-CN-slides/index-standalone.html",
    "bytes": 4299348
  },
  "htmlExport": {
    "requestedMode": "standalone",
    "actualMode": "standalone",
    "requiresLocalServer": false,
    "fallbackPath": null,
    "standaloneAttempt": {
      "attempted": true,
      "accepted": true,
      "loaderGaps": [],
      "failureReason": null
    }
  },
  "standaloneGate": {
    "required": true,
    "passed": true,
    "reason": null
  },
  "layoutAuditSummary": {
    "slideCount": 28,
    "overflowCount": 0,
    "unreadableCount": 0,
    "renderErrorCount": 0,
    "retryCount": 4
  },
  "playwrightFailed": 0,
  "ignoredOutputs": []
}
```

## Requirement Comparison

| Requirement | Current status | Evidence |
| --- | --- | --- |
| Use the local Slidev fork | Passed | report shows `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` |
| Use the full Slidev skill, not only `SKILL.md` | Passed | `skillRootPath = /home/jacob/slidev/skills/slidev`, `skillReferenceCount = 52` |
| Non-outline export path includes source preparation | Passed | UI-equivalent verifier calls production `prepareSlidevExportSource()` before export |
| Native standalone must pass strictly | Passed | `actualMode = "standalone"`, `requiresLocalServer = false`, `standaloneGate.passed = true` |
| Do not silently accept broken standalone output | Passed | bad attempts are rejected through `loaderGaps` and preserved as `index-standalone.failed.html` before fallback |
| Real file acceptance uses `architecture.zh-CN.md` | Passed | strict report source is `architecture.zh-CN.md` |
| Full-deck rendered layout gate | Passed | 28 audited slides, zero overflow, zero unreadable, zero render errors |
| UI has export format selection | Passed for sidebar and settings | sidebar exposes `.notemd-slide-export-format-select`; settings exposes default format and HTML mode |
| Generated output must remain inspectible | Passed locally | `ignoredOutputs = []`; `git check-ignore` prints nothing for current generated paths |
| Do not commit test/generated output to main | Passed for this acceptance slice | archived output lives under `/home/jacob/slidev-export-review/...` and main stayed clean before this tracked acceptance note |

## Failure Found And Fixed

The first strict standalone gate failed even though the local Slidev fork produced a standalone bundle. The NoteMD detector treated a minified loader identifier such as `$n` as missing because the old boundary check did not model JavaScript identifier characters correctly.

The fix was in NoteMD, not in the generated deck:

1. `detectStandaloneBundleLoaderGaps()` now uses a JavaScript identifier-aware boundary.
2. HTML export records structured outcome fields: `requestedMode`, `actualMode`, `requiresLocalServer`, `standaloneAttempt`, and fallback state.
3. The strict verifier fails when compatibility fallback hides native standalone failure.

This is why the earlier compatibility report can be `ok: true` while `actualMode = "server-script-fallback"`; that is not accepted as a native standalone pass.

## Architecture Progress

The export path is now a complete operation owned by the export command:

```text
UI command or sidebar action
  -> exportSlidesCommand()
  -> probeEnvironment()
  -> prepareSlidevExportSource()
  -> convergeSlidevDeckLayout()
  -> exportSlidevHtmlWithOutcome()
  -> strict standalone outcome or explicit server-script fallback
```

Important boundaries that are now in the codebase:

1. `prepareSlidevExportSource()` owns deck preparation, full skill loading, existing-deck working-copy isolation, and sibling support-entry mirroring.
2. `convergeSlidevDeckLayout()` owns rendered-layout feedback and bounded patch/rebuild.
3. `exportSlidevHtmlWithOutcome()` owns standalone versus server-script outcome reporting.
4. `detectStandaloneBundleLoaderGaps()` owns post-build standalone sanity detection.
5. UI code only chooses config and dispatches the complete operation.

This is the right direction. Moving the layout or standalone checks back into prompt-only instructions would be a regression.

## Remaining Risks

1. The Obsidian CLI can dispatch `notemd:export-slides`, but it still does not expose an export-complete handshake. The maintainer verifier is therefore stronger evidence than host-command smoke.
2. Very rich custom/component-heavy layouts outside the supported structural set may still need manual review or new patcher support.
3. Full-deck Playwright verification is slower than representative sampling, but weakening it would reintroduce the original false confidence.
4. The historical repo still contains tracked `docs/dist` and old `docs/export/test-*` artifacts. This acceptance slice does not add new generated output to that debt.

## Next Direction

1. Keep `npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json` as the native standalone closure gate.
2. Keep large generated acceptance output outside the repo and commit only the acceptance index plus reproducible commands.
3. Add richer component/custom-layout fixtures only when they map to a concrete supported patcher boundary.
4. If a Slidev skill PR is prepared, keep it generic: full references, built-in/configured theme preference, closed frontmatter, transform/zoom guidance for large content, browser-sampled verification, and output cleanup. Do not upstream NoteMD vault paths, local fork detection, or this project fixture.
