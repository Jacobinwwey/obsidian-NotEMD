# Release 1.9.12 implementation and acceptance

## Scope and mechanism

The 1.9.11 preview grouped diagnostic tags, but its outer container was always visible. Adding a native outer disclosure lets the preview retain just the summary when no error exists. The existing diagnostic counter supplies the initial open state. Grouping now uses severity plus tag, and only error groups start open, so mixed-severity tags cannot expose warnings as errors. No diagnostic producer, export operation or record is changed.

## Verification

The new no-error/error panel assertions failed against the old container. The mixed-severity test also failed before the grouping change. The focused preview and diagnostic suites subsequently passed 45 tests. The final release additionally requires the production build, complete Linux/Windows CI, lint/UI/render-host audits and full localized website checks. Native CLI acceptance checks the compact no-error panel without generating another diagram or calling a provider.

Local verification passed: production build; 306 Jest suites with 2,983 tests passed and one platform skip; 451 focused diagnostic/version/document tests; UI/render-host audits; and the three-file lint ratchet with zero regressions. Official Obsidian CLI verified the installed 1.9.12 candidate: all 10 real diagnostic records remain in three closed groups under the initially closed outer panel. Its collapsed height is about 48 px, compared with 932 px when fully expanded. Unit regressions separately verify that only error groups open, including shared tags with different severities.

## Documentation and publication

The user selected a new 1.9.12 release after 1.9.11 had become public. Preserve 1.9.11 assets. Update metadata, welcome summaries, changelog, paired release notes, 31 README manuals and 34 website locales. The root assistant authors all translation changes directly; no translation API or LM Studio is used. Publish through the sole checked-in Actions publisher, verify the four downloaded assets, then explicitly deploy Pages and inspect the live version.

The [1.9.11 recovery acceptance](./drawnix-export-recovery-acceptance.md) remains the evidence for layout, PDF and task-log behavior. This follow-up changes disclosure defaults only.
