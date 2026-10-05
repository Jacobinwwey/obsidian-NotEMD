# Drawnix layout, PDF and task-log recovery

The failed `architecture.zh-CN_drawnix-9` run is the acceptance input. Preserve the original note, generated files, and all nodes/relationships. Reuse the frozen generation specification without another provider request. Work is on `codex/drawnix-layout-pdf-task-logs`; the completed 1.9.10 release remains unchanged.

Root causes: tree placement ignores cross-relationship distance; compact routing rejects all previous-line crossings while reserved routing ignores overlap; svg2pdf splits commas inside scoped functional CSS selectors; reporter acquisition/action/display resets erase the task transcript.

1. Snapshot the failure on E: and add failing regressions.
2. Resolve safe SVG styles using the browser cascade at the PDF boundary, retaining vector geometry and Chinese text.
3. Optimize sibling placement by relationship distance without removing content; penalize collinear routing overlap while allowing unavoidable crossings.
4. Retain the transcript across subtasks, previews and sidebar rebuilding; separate explicit log clearing from progress reset.
5. Run focused regressions, production build, full Jest, lint regression checks and CLI verification against the real input. Compare node/edge preservation, connector length/overlap, PDF content and task logs.
6. Group preview diagnostics by tag in default-closed native disclosures, keeping every record and all severity counts. Verify mixed severity and future tags.
7. Update 1.9.11 metadata, paired release/acceptance docs, README manuals and all website locales with directly authored translations. Run release checks, integrate remote main, publish through the sole Actions publisher and explicitly deploy Pages after release verification.

Constraints: CLI only; no computer-use or UI automation; no unrelated refactors, release mutation, translation API calls or arbitrary relationship limits. Any bounded search limit is a layout computation budget, never a content limit. Existing SVG sanitation and native Drawnix contracts remain in force.
