# Multiple diagram generation

## Scope and decisions

Retain completed sibling exports, configurable cache storage and PDF label fixes. Presentation exports remain a separate pipeline. Introduce a versioned per-type preference record alongside the legacy single-type projection; preserve unknown fields and inactive requests. Empty selection means automatic source analysis. Each selected type owns its output requests, including while deselected.

Use compact type and format popups. Checkboxes control inclusion; clicking a type name includes it and edits its formats. Hover and keyboard focus preview a type without saving. The existing preview moves beside the open menu (above it on narrow screens), with a placeholder preserving its original layout. Closing restores it. Show compatible formats first and retain unavailable items visibly disabled; do not silently switch chart types.

Freeze all operation inputs before sequential generation under the existing command lock. Isolate per-type failures, stop pending work on cancellation and return explicit per-type results. Keep explicit single-type CLI requests backward compatible. Each type retains its own export receipt/retry record.

Publish files as `<note>_<semantic-type>.<extension>` (`drawnix-knowledge-map` uses `drawnix`). Reserve a shared stem across formats; use numeric suffixes on collision. Cache UUIDs remain independent. Write manifest v3 while retaining v1/v2 readers and their path invariants.

## Delivery gates

1. Preference migration, per-type isolation, unknown schemas and deselection/reselection tests.
2. Command batch, partial failure, cancellation, CLI contract and filename/recovery tests.
3. Real DOM pointer/keyboard/320px tests and existing preview race tests.
4. Build and reload using CLI into the open `1Knowledge` vault; verify actual multi-type exports and unchanged user preferences.
5. Full tests, lint ratchet, UI/render audits, bilingual documentation; push main and check the new CI run.

## Trade-offs

Sequential generation bounds provider and renderer load and simplifies cancellation. It costs total latency but avoids concurrent modal/render-host contention. Stable readable filenames need explicit collision reservation; UUID-only filenames would avoid allocation but fail the requested naming convention. User settings must not be mutated by temporary preview state or CLI overrides.

## Verification

- Local build, 298 test suites (2,870 passed, one existing skipped), lint ratchet, UI-string audit, render-host audit and diff hygiene passed.
- Real Chromium tests cover 320px/900px menus, preview relocation/restoration, scrolling without hiding the preview, focus/Escape, independent formats, live settings replacement and serialized saves.
- Official Obsidian CLI loaded the build into the open `1Knowledge` vault. The source `full_processed_zh-CN.md` produced Nested SVG/PNG/PDF, Flowchart Mermaid/SVG, and Drawnix source/HTML/SVG/PDF beside the source. All nine delivery receipts match SHA-256; source text is unchanged. Drawnix's initial provider timeout did not block the other types; a focused retry through saved preferences completed its four formats.
- Six Drawnix relationship labels were extracted from the new PDF and visually checked. No Unicode replacement characters appeared in the checked text outputs. The configured output language was retained.
- Native settings verification restored the original settings bytes. Measured checkbox targets are 44×47 CSS px; focus-to-next-frame feedback p95 was 55.1 ms across 20 samples. The law audit uses these observations; whole-product conversion/CTA and unmeasured spacing metrics remain unknown.
- Recovery coverage includes v1/v2 manifests, v3 tampering, per-format retry, cancellation, case-insensitive and concurrent filename collisions. Presentation configuration was not merged with diagram preferences.

Evidence scripts/reports remain local under `.cache/multichart-*`; they are verification artifacts, not plugin runtime dependencies.
