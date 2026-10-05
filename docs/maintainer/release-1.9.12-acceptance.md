# Release 1.9.12 implementation and acceptance

## Scope and mechanism

The 1.9.11 preview grouped diagnostic tags, but its outer container was always visible. Adding a native outer disclosure lets the preview retain just the summary when no error exists. The existing diagnostic counter supplies the initial open state. Grouping now uses severity plus tag, and only error groups start open, so mixed-severity tags cannot expose warnings as errors. No diagnostic producer, export operation or record is changed.

## Verification

The new no-error/error panel assertions failed against the old container. The mixed-severity test also failed before the grouping change. The focused preview and diagnostic suites subsequently passed 45 tests. The final release passed the production build, complete Linux/Windows CI, lint/UI/render-host audits and full localized website checks. Native CLI acceptance checked the compact no-error panel without generating another diagram or calling a provider.

Local verification passed: production build; 306 Jest suites with 2,983 tests passed and one platform skip; 451 focused diagnostic/version/document tests; UI/render-host audits; and the three-file lint ratchet with zero regressions. Official Obsidian CLI verified the installed 1.9.12 candidate: all 10 real diagnostic records remain in three closed groups under the initially closed outer panel. Its collapsed height is about 48 px, compared with 932 px when fully expanded. Unit regressions separately verify that only error groups open, including shared tags with different severities.

## Documentation and publication

The user selected a new 1.9.12 release after 1.9.11 had become public. The 1.9.11 assets were preserved. Metadata, welcome summaries, changelog, paired release notes, 31 README manuals and 34 website locales were updated. The root assistant authored all translation changes directly; no translation API or LM Studio was used.

## Final publication evidence

- Both [candidate CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37272307032) and [main CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37274414616) completed successfully on Linux and Windows. Each platform passed 306 suites: Linux passed 2,984 tests; Windows passed 2,983 with one platform skip.
- The [website candidate check](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37272400096) passed the 34-language build and audit, plus navigation/accessibility checks across 96 pages with zero failures.
- [Notemd 1.9.12](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.12) became public on 2026-10-05 through the [checked-in Actions publisher](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37274489101), from tag commit `0f493b8d3cd60553e5a517660ca1a729ce4acdfc`. All four required assets were independently downloaded and their SHA-256 hashes verified below. The workflow also completed its chronicle refresh.
- The first publisher attempt created a draft that its immediate lookup did not yet observe. After confirming that this draft was unpublished and had no assets, rerunning the failed workflow jobs succeeded. The same publisher and tag were retained; no public assets were replaced.
- After the release was verified as public, the [Pages deployment](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37274414551) was explicitly rerun using the verified website build artifact and succeeded. All 34 live localized release pages returned HTTP 200 with the 1.9.12 title, including the [English](https://jacobinwwey.github.io/obsidian-NotEMD/docs/releases/1.9.12/) and [Chinese](https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/releases/1.9.12/) pages.
- The published `main.js`, `manifest.json` and `styles.css` were installed in the local `1Knowledge` Vault and reloaded through the official Obsidian CLI. Installed hashes match the published assets. Native acceptance again retained all 10 records in three initially closed groups, with the whole panel initially closed (47.6875 px versus 931.7916870117188 px fully expanded). This real sample has zero errors, two warnings and eight information records; error-only automatic expansion is covered separately by the focused regressions.

| Published asset | SHA-256 |
| --- | --- |
| `main.js` | `f4b96e4c85205efc74bc9958161d999ef17074cf994d0db810884bc786775e99` |
| `manifest.json` | `3556d65102baf9148b6053a7822abc2f4b3105c5f66b8859b88b3f7d469af17b` |
| `styles.css` | `eb2ac6c22652b2755ab70a82481fe3f45280f941b60f0f4e53efc6370e243fd1` |
| `README.md` | `7c4fadfd2ddd6a15b362533a78168aa91d1197153f2d4ab5ca689231f7922f78` |

Local evidence is retained under `.cache/drawnix-task-regression/`: `public-release-1.9.12-verified.json`, `installed-public-release-1.9.12.json`, `published-pages-1.9.12.json` and `native-diagnostics-1.9.12.json`. These final acceptance records do not alter the published tag, assets or website source.

The [1.9.11 recovery acceptance](./drawnix-export-recovery-acceptance.md) remains the evidence for layout, PDF and task-log behavior. This follow-up changes disclosure defaults only.
