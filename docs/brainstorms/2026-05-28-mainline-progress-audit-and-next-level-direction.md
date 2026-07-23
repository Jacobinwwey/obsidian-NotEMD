---
date: 2026-05-28
last_updated: 2026-07-03
topic: mainline-progress-audit-and-next-level-direction
canonical: true
---

# Mainline Progress Audit And Next-Level Direction

## 2026-07-23 Drawnix Implementation Truth

The Drawnix work described by the earlier audit is now implemented as a separate `drawnixMindmap` intent. The production chain is `DiagramSpec -> DrawnixMindMapProjection -> native .drawnix -> dedicated SVG`, while standard Mermaid `mindmap` generation remains unchanged. The architecture-canvas decision is closed as rejected; architecture flowcharts stay on Draw.io or Mermaid. The optional Plait preview remains gated on verified bundle isolation.

## 1. Why This Document Exists

The repository has moved again since the 2026-05-28 provider-settings/model-discovery closure audit.

The mainline is no longer best described as:

1. still proving whether bounded recovery landed;
2. still only carrying the first provider-settings/model-discovery milestone;
3. still lacking a stable description of the current control-plane boundaries.

The current need is narrower and more operational:

1. restate current-main truth after the latest `1.9.2` release boundary, remote-main resync, and later post-release contract/evidence follow-through commits;
2. compare that truth against the earlier plan language and identify where those documents are now stale;
3. define the next bounded direction without re-opening already-closed existence questions.

Primary comparison sources:

1. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.md`
2. `docs/brainstorms/2026-05-25-post-bounded-recovery-audit-and-next-level-direction.md`
3. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.md`
4. `.trellis/spec/claude-dev/frontend/provider-settings-model-discovery.md`
5. live code in:
   - `src/llmProviders.ts`
   - `src/providerModelDiscovery.ts`
   - `src/openaiCompatibleEndpointFamily.ts`
   - `src/providerRequestHeaders.ts`
   - `src/ui/NotemdSettingTab.ts`
   - `src/main.ts`
   - `src/llmUtils.ts`
   - `src/localKnowledgeBase.ts`
   - `src/ui/NotemdSidebarView.ts`
   - `styles.css`
6. shipped release/docs truth in:
   - `docs/releases/1.9.2.md`
   - `docs/releases/1.9.2.zh-CN.md`
   - `change.md`
   - `src/ui/welcomeReleaseNotes.ts`

## 2. Current Mainline Truth

### 2.0 Live branch and release boundary are now explicit again

Current audit baseline is no longer “some post-plan local worktree”.

It is:

1. `origin/main` after the `1.9.2` release cut plus later post-release contract/evidence follow-through commits;
2. local `main` resynchronized to that exact remote head before this batch started;
3. clean `main...origin/main` state before this document update.

Interpretation:

1. this audit is grounded in a shipped and re-synced branch boundary, not in speculative local-only WIP;
2. any older wording that still frames clean-state or remote-sync as unresolved is stale.

### 2.1 Packaging / runtime truth is still intentionally narrow

No meaningful change in shipping boundary happened in this lane:

1. current build truth is still single-entry `main.js`;
2. `audit:render-host` still enforces inline/runtime-host truth rather than a shipped detached render-host asset;
3. source continues to contain latent render-host/runtime candidates, but they are still source-organization truth, not release truth;
4. the production build path now has an explicit guard around that split: `createRenderHostBundleBuildOptions()` remains candidate-only and is not consumed by `esbuild.config.mjs` unless release assets, audit rules, and docs move in the same batch.

Interpretation:

1. packaging is still a separate architecture lane;
2. provider-settings/model-discovery progress must not be allowed to blur packaging truth.

### 2.2 CLI / automation truth is unchanged in boundary, not in importance

The recent provider work did not widen the public CLI surface.

Current truth remains:

1. the public-safe export slice is still deliberately narrow;
2. maintainer/helper surfaces remain wider but bounded;
3. provider-settings/model-discovery improvements are still product-surface and settings-surface work, not evidence of a broader public CLI contract.

Interpretation:

1. do not let new provider helper capabilities leak into public-CLI claims;
2. CLI expansion remains a separate decision gate.

### 2.3 Product-surface truth remains materially ahead of the old recovery baseline

The earlier bounded-recovery slices remain landed on current main:

1. preview history and saved-artifact-aware reopening;
2. onboarding release digest;
3. settings reset;
4. concept-note prerequisite guidance;
5. local knowledge-base retrieval for the bounded task set;
6. chapter split plus deterministic managed-artifact behavior;
7. regex/file-selection profiles and batch-input control;
8. API liveness/activity UI and related operator feedback surfaces.

Interpretation:

1. the current progress bottleneck is no longer “did the user-facing guardrails come back?”;
2. the next bottleneck is control-plane convergence and bounded breadth management.

### 2.4 Provider settings and model discovery are now the main current-main control-plane truth shift

Current `main` now directly carries a broader bounded convergence than the earlier 2026-05-25 audit language captured.

What is materially true now:

1. `src/llmProviders.ts` is no longer only transport/runtime metadata:
   - it now carries shared `settingFields` taxonomy (`core`, `contextual`, `advanced`, `developer`);
   - it now carries per-provider `modelDiscovery` metadata;
   - it now resolves provider-specific/manual-first discovery disable reasons;
   - it now supports canonical provider-name normalization and host-aware known-model token lookup.
2. `src/ui/NotemdSettingTab.ts` is no longer primarily provider-name-driven for settings taxonomy:
   - the provider panel now renders through shared field metadata;
   - advanced disclosure open/close state persists across re-renders in the settings session;
   - persisted advanced/developer overrides still force visibility when needed;
   - discovered-model selection now updates the model field, gives apply feedback, collapses the discovered-model panel, and participates in model-aware token syncing.
3. `src/providerModelDiscovery.ts` is no longer only a minimal first-batch helper:
   - it now supports a bounded verified family set that includes OpenAI-compatible presets, OpenRouter, LiteLLM proxy-family, Together, Anthropic, Ollama, Google, Huawei Cloud MaaS, Vercel AI Gateway, AIHubMix, GitHub Models, PPIO, OVMS, and xAI;
   - it now tolerates broader wrapped catalogs such as `provider_models`, `providerModels`, `publisherModels`, `registry`, `registries`, and `services`;
   - it now preserves transient discovered-model metadata such as label, owner/provider hints, and max-output-token hints;
   - it now performs conservative resource-name normalization for `models/<id>` and `publishers/<owner>/models/<id>`;
   - it now filters wider registries toward generation-relevant models instead of indiscriminately surfacing every embedding/reranker/speech row.
4. `src/openaiCompatibleEndpointFamily.ts` and `src/providerRequestHeaders.ts` now act as shared control-plane seams:
   - family detection distinguishes local OVMS-style `/v3` endpoints from LiteLLM-style local proxies;
   - runtime and discovery reuse the same compatibility-header ownership for headers such as `Authorization`, `X-Api-Key`, OpenRouter/Requesty referer-title headers, AIHubMix `APP-Code`, GitHub Models API versioning, and Cerebras integration headers.
5. model-aware token guidance is now explicit state, not only heuristic coincidence:
   - `globalModelAwareMaxTokensTracking` persists the current auto-managed global baseline for manual model edits, resets/reloads, and runtime request ceiling selection;
   - discovered-model application now uses its own provider-scoped lane (`discoveredModelMaxOutputTokensTracking`) instead of silently rewriting the global token cap;
   - generic/custom gateways can now also reuse upstream token-cap metadata for bare model ids when the registry itself returns an explicit owner/provider hint, while arbitrary bare-model guessing still remains out of bounds.

Interpretation:

1. the lane is now past “bootstrap the architecture”;
2. the lane is now in bounded breadth management and truth-maintenance mode.

### 2.5 Clean-state closure is now re-proved, not still pending

The older audit language that treated clean-state as still pending is now stale.

Current truth is:

1. the provider-settings/model-discovery closure work has already been committed onto `main`;
2. the repository is currently back to a clean `main...origin/main` state after that lane landed;
3. clean-state is therefore no longer the next unresolved bottleneck for this lane.

Correct interpretation:

1. clean-state must still remain a finish gate for every later batch;
2. it should no longer be described here as an unclosed prerequisite blocking the next-direction discussion.

### 2.6 `1.9.2` changed mainline truth in a narrower but still important way

The latest shipped delta did not reopen architecture scope. It tightened truth around already-landed lanes.

What is materially true now:

1. sidebar observability layout regression is fixed on shipped `main`:
   - `styles.css` again contains the footer scroll container plus bounded API-activity region styles;
   - `src/ui/NotemdSidebarView.ts` again renders log output and API activity inside the same scrollable shipped surface without letting activity rows crowd logs out of view.
2. local knowledge-base inspection is now more diagnosable without widening the public runtime contract:
   - `src/localKnowledgeBase.ts` now exposes structured `queryDiagnostics`;
   - inspect results can now distinguish low-signal basename derivation from a healthy retrieval path, including cautions for navigation-like notes such as `index.*`.
3. maintainer CLI examples and docs now better match runtime reality:
   - docs and helper examples consistently use vault-relative paths for `--vault docs` flows;
   - this reduces drift between maintainer examples and the real retrieval/chapter-split execution contract.
4. chapter split is now more visible as shipped product truth, not only maintainer truth:
   - dedicated chapter split + TOC spotlight docs and showcase assets are now part of the checked-in release-facing documentation surface.
5. release maintenance truth tightened again:
   - chronicle refresh helper authorship now preserves maintainer identity instead of silently collapsing to a bot-like identity.
   - workflow-source checkout and chronicle-target branch truth now share `scripts/lib/packaging-contract.js` ownership, with workflow env names and helper/tests keeping the GitHub Actions bootstrap values aligned.
   - release workflow tag-trigger glob truth now also lives in `scripts/lib/packaging-contract.js`, while `.github/workflows/release.yml` keeps only the GitHub Actions bootstrap literal required before checkout.
   - semantic verification now distinguishes workflow-start trigger truth from numeric release admission: `*.*.*` starts the workflow, and `scripts/release/validate-release-tag.js` still enforces the numeric `x.x.x` contract.
   - the checked-in release / chronicle / repo-saga entrypoints now also have process-level regression proof instead of only helper-function proof:
     - `scripts/release/publish-github-release.js` is now exercised through real `--dry-run` create/repair command planning plus real wrapper failures for invalid or missing tags;
     - `scripts/release/commit-chronicle-refresh.js` is now exercised through real clean no-op, explicit `--target-branch` override, and git-status failure paths;
     - `scripts/repo-saga/update-quarterly-saga.mjs` is now exercised through real `--sync-only`, active execution-lock refusal, isolated `--no-readme --tag` generation, and fail-fast invalid-argument paths.
   - the checked-in release helper entrypoints now also have process-level regression proof instead of only module-level helper proof:
     - `scripts/release/publish-github-release.js` is now exercised through real `--dry-run` create/repair paths plus real tag-wrapper failures;
     - `scripts/release/commit-chronicle-refresh.js` is now exercised through real clean no-op, explicit target-branch override, and git-failure paths;
     - `scripts/repo-saga/update-quarterly-saga.mjs` is now exercised through real `--sync-only`, active-lock refusal, isolated `--no-readme --tag` generation, and fail-fast invalid-argument paths.

Interpretation:

1. `1.9.2` is not a “new architecture lane” release;
2. the post-`1.9.2` release-contract follow-through is still in the same lane: it reduces operator confusion, doc/runtime drift, and release-process ambiguity without changing shipped plugin behavior.

### 2.7 Current `890b21b` Stage-B2/C/D follow-through baseline

The current execution baseline before this document update is `890b21b` (`docs(progress): align post-recovery packaging truth`), with local `main`, `origin/main`, and the working tree aligned cleanly before this batch started. The earlier local-KB fixture anchor remains `824d07e` (`test(local-kb): cover chapter split showcase retrieval`).

That fixture lane matters because it moved Stage-C evidence from narrative-only progress wording into runnable checks: `npm run verify:local-kb-fixtures` now exercises the live MiniSearch-backed retrieval path against real-note-style chapter-split docs-vault examples, including managed artifacts, guarded reruns, stable TOC block refs, cross-folder task-contract retrieval, and real-note/query diversity beyond the chapter-split showcase.

The follow-through slice after `7999a5f` did not change the runtime retrieval algorithm. Instead, it carried the already-proven docs-vault retrieval paths into the maintainer operator surface: `local-knowledge.inspect` helper help, the bilingual capability matrix, and docs-alignment tests now jointly cover explicit research queries, cross-folder batch-title source paths, diagram-source retrieval, and bounded `topK` / `slidingWindowSize` overrides. That matters because it removes the gap where tests prove the path but maintainers still lack runnable, drift-resistant examples. It does not widen the public CLI boundary, and it does not promote the maintainer-only inspect seam into a user-facing API.

Requirement-by-requirement status against `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/prd.md` is now:

| PRD requirement | Current code/docs truth | Status | Next interpretation |
|---|---|---|---|
| R1 local-KB task support | `Generate from title`, `Batch generate from titles`, `Research & summarize`, and `Generate diagram` now route through the settings-driven retrieval path when enabled | Landed | Do not keep treating task wiring as open; spend effort on quality depth |
| R2/R3 local-only and fallback behavior | The runtime uses plugin-native MiniSearch lexical retrieval; disabled retrieval and empty-context cases preserve the original task path | Landed | Keep describing this as lightweight local retrieval, not as a full semantic RAG platform |
| R4/R4a/R4b settings and source paths | Mixed vault-relative file/folder knowledge-base paths, default lists, and task overrides with blank fallback are present | Landed | Improve examples and inspect ergonomics before adding more task types |
| R5 comparison research | Local-RAG and TOC comparison artifacts exist under the active task's `research/` directory | Landed as decision support | Ground future comparison claims in current Notemd task contracts, not generic RAG slogans |
| R6/R7 chapter split | Command/sidebar/maintainer surfaces, deterministic TOC metadata, stable block refs, manifest-backed guarded reruns, and managed artifact results are present | Landed | Keep showcase docs aligned with the write contract as result schemas evolve |
| R8 packaging / semantic truth | The shipped boundary remains `main.js` plus inline `srcdoc`; no dedicated runtime asset is claimed | Landed as a constraint | Treat packaging convergence as the next P0 architecture lane, not as already complete |
| R9/R10 tests, docs, and CI stability | Existing integration tests plus `verify:local-kb-fixtures` cover retrieval injection, fallback, inspect, chapter-split showcase behavior, cross-folder task-contract retrieval, and low-signal navigation-source diagnostics; maintainer help/docs alignment tests now also lock the real docs-vault example payloads | Ongoing finish gate | Continue locking progress wording with tests before broadening claims, and keep helper examples vault-relative without letting them drift into public CLI wording |

Architecture interpretation:

1. local-KB is a plugin-native MiniSearch lexical retriever with task-scoped prompt injection, not a shipped external semantic RAG stack;
2. `local-knowledge.inspect` is a maintainer-only diagnostics seam, not a public CLI expansion;
3. chapter split is a managed artifact write contract with deterministic rerun behavior, not only a text transformation helper;
4. packaging truth remains single-entry `main.js` plus inline `srcdoc`, so latent render-host source candidates are still source-only candidates until a later batch changes build, release, audit, and docs together.

### 2.8 Local retrieval decision truth should no longer live only in `.trellis`

The current local-KB implementation is already shipped, but the most explicit comparison research originally lived under `.trellis/tasks/05-19-local-kb-retrieval-chapter-split-stage-b2cd/research/`. That is useful for development, but it is not durable repo truth on its own.

The repo-owned decision that now needs to remain explicit is:

1. **MiniSearch remains the chosen implementation base** for current main because it is:
   - TypeScript-native
   - local-only
   - in-process
   - server-free
   - GPU-free
   - operationally narrow enough for an Obsidian plugin runtime
2. **LightRAG, txtai, and Mem0/Embedchain remain rejected as direct runtime bases** for this batch because they are Python-first and/or push the architecture toward a heavier service, vector-store, or companion-runtime shape than current main should carry.
3. **Smart Connections and Smart Composer remain reference products, not implementation bases**:
   - useful for future product/UX ideas;
   - still too heavy in embedding / local-db / adjacent-runtime footprint for the current bounded slice.
4. **RAGPerf / ragas remain evaluation references, not runtime dependencies**:
   - they are useful for judging retrieval quality;
   - the correct near-term move is to borrow their evaluation mindset off the hot path, not to embed their stack into the plugin.

Correct interpretation:

1. current main should continue to describe local-KB as a plugin-native MiniSearch lexical retriever with task-scoped prompt injection;
2. any future semantic/vector expansion must be treated as a new architecture decision, not as something already implied by the current shipped lane;
3. `.trellis` research may guide future work, but the repo must keep the actual decision visible in tracked progress truth so later sessions do not regress to vague “local RAG” wording.

This is no longer only a principle statement. The repo now carries tracked mirrors for that research truth in:

1. `docs/brainstorms/2026-06-09-local-kb-retrieval-decision-and-quality-truth.md`
2. `docs/brainstorms/2026-06-09-local-kb-rag-quality-and-execution-truth.md`
3. `docs/brainstorms/2026-06-09-chapter-split-knowledge-management-and-toc-comparison-truth.md`

Those mirrors are now also part of executable Stage-C evidence instead of remaining docs-only truth: the local-KB offline fixture and maintainer inspect examples now probe them through real retrieval paths.

### 2.9 Current `7af2f9b` docs-sync baseline

The current remote-synced baseline is now also explicit at the documentation layer: `7af2f9b` (`docs(progress): sync current-main helper proof truth`).

What that baseline means:

1. no shipped runtime or product behavior changed in that docs-sync commit;
2. the canonical current-main progress docs now explicitly treat the release / chronicle / repo-saga helper-entrypoint proofs as landed evidence instead of future intent;
3. the diagram-platform roadmap is now expected to describe:
   - Task 0 as packaging/source-build boundary truth;
   - Task 2 as compatibility-surface convergence rather than pipeline existence work;
   - Task 3 as MermaidProcessor responsibility reduction under a real-Obsidian verification bar.

Correct interpretation:

1. current-main truth maintenance now includes keeping roadmap/progress language synchronized with the checked-in helper-entrypoint evidence;
2. document sync is now a regression boundary, not optional prose cleanup.

### 2.10 2026-06-18 Slidev export rendered-layout truth

This batch changes the Slidev export lane from "can the workflow run?" to "can the exported deck be trusted as a visible, readable artifact?"

Current code already satisfies several earlier requirements:

1. command palette export and sidebar export both enter `exportSlidesCommand()`;
2. settings expose default format selection across `HTML`, `PDF`, `PNG`, and `MP4`, and expose HTML mode when `HTML` is selected;
3. the sidebar has an inline Slidev export format selector instead of hiding format choice entirely;
4. `exportSlidesCommand()` now probes environment, prepares a Slidev export source, runs the shared `convergeSlidevDeckLayout()` loop, and only then emits the selected final format from the converged prepared deck;
5. `prepareSlidevExportSource()` loads the top-level Slidev skill and `references/*.md` when available, and the LLM prompt explicitly asks for dense prose/table/code to be split while preserving each Mermaid source fence and fitting it through layout, zoom, Transform, or manual review evidence;
6. existing Slidev decks now write into isolated `_slidev-sources/<deck-basename>/` workspaces, and common sibling Slidev support entries such as `layouts/`, `public/`, `setup/`, `components/`, `snippets/`, `styles/`, `global-top.vue`, and `global-bottom.vue` are mirrored there when present;
7. `scripts/verify-slidev-export-workflow.cjs` exercises production modules against the real `docs/architecture.zh-CN.md` source and records skill reference count, local fork, deck summary, Playwright results, and `.gitignore` visibility.

The important gap is equally clear:

| Requirement | Current implementation | Status |
|---|---|---|
| Full Slidev skill support in non-outline generation | `loadSlidevSkillContext()` reads `SKILL.md` plus sorted `references/*.md` and includes the contents in the prompt | Landed |
| Local Slidev fork usage | Slidev command resolution prefers env overrides and then `$HOME/slidev/packages/slidev/bin/slidev.mjs` | Landed, keep verifying |
| UI format selection | Settings and sidebar controls expose format selection; HTML mode is conditional on HTML | Landed in code, still needs real UI smoke when UI changes |
| Output visibility to Git | `verify:slidev-export` checks `.gitignore` hits for generated deck/output/screenshots | Landed for workflow evidence |
| Rendered layout containment | Visible-root DOM bbox, scroll overflow, Mermaid host, table, code, and text overflow audit exists in the real maintainer workflow | Landed |
| Automatic correction | `SlidevDeckPatch` now applies measured `zoom`, slot-zone-geometry-driven local `<Transform>` wrapping, table/code structural splitting, pathological table record fallback, generic slot-marked layout splitting, and first-slide headmatter structural splitting in a bounded retry loop shared by the verifier and `exportSlidesCommand()`; Mermaid source fences are preserved rather than auto-split | Landed, keep extending |

The `ref/infinite-canvas` analysis supports a clean-room direction, not code reuse. Its useful architecture ideas are world-space nodes with `{ position, width, height }`, viewport transform `{ x, y, k }`, screen/world conversion, union bounds, natural image sizing, and minimap/bounds calculation. Those ideas map well to a static export-layout camera for Slidev. They do not justify turning Slidev into an interactive infinite canvas, and AGPL-3.0 code must not be copied into this MIT project.

Correct interpretation:

1. the workflow proof is now meaningfully stronger than direct `slidev build`;
2. the workflow now includes a real render-feedback quality gate instead of only a CLI smoke path;
3. the real `docs/architecture.zh-CN.md` HTML fixture now closes at `ok: true` with `28` audited slides, zero overflow/unreadable findings, and `retryCount = 4`, while `PDF` and `PNG` on the same source also return `ok: true`;
4. current landed truth is already past the original plan wording: workspace-aware resolution for the local Slidev fork, Slidev skill roots, and Playwright browser cache is in place, the local checkout is confirmed against `https://github.com/Jacobinwwey/slidev.git`, full-deck visible-slide-root audit is in place, existing Slidev decks now go through isolated working copies with sibling support-entry mirroring, the patch loop now covers Mermaid, Markdown tables, pathological table fallback, code fences, dense text, generic slot-marked layouts, component-heavy custom-slot local `<Transform>` fallback, and first-slide headmatter instead of only zoom, known-bad standalone bundles now fall back to server-script HTML rather than being treated as good output, and the real `architecture.zh-CN.md` strict native standalone run now passes with `actualMode = "standalone"` after fixing the `$n` loader-binding false positive in NoteMD's sanity detector;
5. a new real custom-layout multi-zone fixture now also proves that when both `summary` and `details` are component-heavy zones, prepared working copies carry lightweight slot-owner wrappers and the rendered measurement now yields zone-level owner rects, content bounds, scroll overflow, and recommended local scale; the patcher uses that geometry first and falls back to slot signals / rendered text hints only when the geometry ties, which prevents retargeting a nonoverflowing sibling zone;
6. a follow-on real custom-layout fixture now also proves a stricter case: when more than one transformable component-heavy zone independently overflows on the same slide, the patcher can inject local `<Transform>` wrappers for each overflowing zone in a single pass instead of forcing a single-owner choice.
7. the next verifier-hardening slice also closed a hidden under-audit bug: slot-owned descendants that had been clipped by `overflow-hidden` but still mattered to layout are now measured, so component-heavy custom layouts no longer pass just because the slot container hid the overflowing children from the old overlap filter.
8. this batch also narrows the overflow contract: whole-slide `zoom` and local `<Transform>` scale still derive from safe-rect-aware measured fit, but pass/fail overflow remains rooted in the rendered slide root rather than treating the safe inset itself as a hard clipping boundary. That keeps the gate tied to real clipping while still making the shrink strategy conservative.
9. the real product export path now matches the verifier on the critical point that mattered most: the patch/rebuild loop is no longer verifier-only, so `HTML`/`PDF`/`PNG`/`MP4` export all reuse the same converged prepared deck.
10. the next architectural step is narrower now: extend structural patching to richer component-heavy custom layouts without regressing back to representative-slide-only audit; the main unresolved shape is no longer "lack of measured scaling" but cases where multiple competing component-heavy slot zones still end up in near-tied geometry and not every overflowing zone is safely transformable, or where the owner surface does not expose a stable structural split / local transform target. Separately, keep native standalone and compatibility fallback as distinct acceptance lanes: `server-script-fallback` is still a useful compatibility result, but it is no longer allowed to satisfy a native standalone claim.

## 3. Deep Comparison Against Earlier Plan Language

### 3.1 What the 2026-05-25 audit now understates

The earlier bounded-recovery audit is now stale in one important way:

1. it still describes the provider lane as if current main had only the first bounded convergence milestone;
2. it still uses old language that contrasts metadata-driven settings against hardcoded settings rendering as if that refactor were still pending;
3. it still frames the discovery batch around a narrower OpenAI-compatible/Ollama/Google surface.

Current code disproves that older wording:

1. metadata-driven settings rendering is already landed;
2. provider-specific discovery disable reasons are already landed;
3. bounded discovery now extends well beyond the original three-family starter batch;
4. runtime/discovery header and endpoint-family alignment are already landed;
5. discovered-model token metadata now directly affects settings defaults.

Correct interpretation:

1. the older audit is still useful for packaging and lane ordering;
2. it is no longer sufficient as the provider-lane truth source.

### 3.2 What the 2026-05-27 provider plan still gets right

The provider-specific plan remains structurally correct on several points:

1. keep persistence simple;
2. keep manual `model` as the only persisted provider-side truth;
3. prefer shared family semantics over provider-name branching;
4. reuse Cherry Studio strategy ideas, not its persisted catalog subsystem;
5. keep documentation honest about what is and is not supported.

Those remain valid and should not be loosened.

### 3.3 What the 2026-05-27 provider plan now understates

That document now undersells current main in several places:

1. it still phrases Phase 3 as if the delivery surface were mainly the initial first batch;
2. it does not fully foreground the newer parser-widening work for wrapped registries and resource-name normalization;
3. it does not clearly distinguish between:
   - trusted-host bare-model token reuse for generic `OpenAI Compatible`;
   - registry-owner-hint bare-model token reuse for transient discovered rows on generic gateways;
   - prefixed gateway-model token inference;
   - globally consistent fallback that is intentionally much narrower.

Correct interpretation:

1. the plan should now be read as a control-plane contract document, not a “future implementation sketch”;
2. the next work item is bounded extension and truth-maintenance, not first delivery.

### 3.4 What the unified matrix must now protect

The unified matrix now needs to protect against recurring misreads:

1. treating wider bounded discovery as permission to claim all-provider discovery;
2. treating host-aware bare-model token lookup as permission to infer ownership for arbitrary custom gateways;
3. treating the presence of shared parser seams as permission to persist remote catalogs later without a new explicit architecture decision.
4. treating `1.9.2` sidebar / inspect / docs improvements as if they widened the public CLI or changed the packaging contract.
5. treating the YAML `*.*.*` trigger literal as an independent release rule instead of a bootstrap value locked against the shared release contract and followed by numeric tag validation.

### 3.5 What the packaging and CLI planning documents still get right

The earlier packaging and CLI planning documents remain directionally correct on two key points:

1. current shipped renderer truth is still `main.js` plus inline `srcdoc`, not a shipped dedicated runtime asset;
2. the correct CLI boundary is still “host-neutral core first, host/file/UI follow-through second,” not broad public command-count growth.

Current code continues to support those earlier decisions:

1. `esbuild.config.mjs`, `scripts/audit-render-host-bundle.js`, and the maintainer docs still lock the single-entry shipping boundary;
2. `src/operations/diagramGenerateOperation.ts`, `src/operations/diagramCommandExecution.ts`, `src/operations/diagramCommandHostAdapter.ts`, `src/operations/publicCliSurface.ts`, and `src/maintainerCliBridge.ts` still preserve the bounded split between:
   - typed core operations;
   - bounded public-safe export commands;
   - wider but explicitly maintainer-only path-based helper flows.

Correct interpretation:

1. provider-lane closure reduced one control-plane risk, but it did not replace packaging or bounded CLI promotion discipline as the next architecture questions;
2. next-level planning should now rotate back to packaging/semantic convergence first, then bounded CLI/public-surface decisions, with provider widening treated as ongoing maintenance instead of the central narrative.

### 3.6 What earlier progress wording now overstates or misplaces

Some older progress wording is now stale in the opposite direction: it gives too much narrative weight to the provider lane and too little to current Stage-C truth maintenance.

Specifically:

1. current main should no longer be described as if provider settings/model discovery are still the only meaningful moving lane;
2. current main should no longer be described as if Stage-C local-KB / chapter-split follow-through is still mainly about feature existence proof;
3. current main should no longer be described as if the latest release-facing truth is still `1.9.0` or `1.9.1`.

Correct interpretation:

1. provider breadth is now a maintenance lane;
2. Stage-C quality/evaluation is now the higher-value product lane next to packaging;
3. `1.9.2` is the current public truth boundary until a later release supersedes it.

### 3.7 What the Stage-B2/C/D PRD now means on current main

The active Stage-B2/C/D PRD should no longer be read as a feature-existence checklist. On current main, R1 through R7 are implementation truth; R8 is a boundary lock that prevents overclaiming packaging; R9 and R10 are continuing finish gates.

This changes the engineering direction:

1. the useful local-KB work is broader real-note/query diversity and failure explainability, not another task-wiring pass;
2. the useful chapter-split work is showcase/doc/result-schema alignment, not another command-surface recovery pass;
3. the useful CLI work is deciding whether any bounded path-based operation deserves public promotion, not turning maintainer diagnostics into implied public support;
4. the useful packaging work is resolving the source/build boundary around latent runtime candidates, not describing candidate files as shipped assets.

## 4. Architecture Advancement Assessment

### 4.1 What has genuinely advanced

1. The provider control plane now scales through shared metadata instead of only through hand-edited settings branches.
2. Discovery and runtime semantics are more converged at the endpoint-family and header-owner layers.
3. Token guidance is no longer just a UI hint; it is now tied into persisted settings state and runtime ceiling behavior.
4. The discovery parser is meaningfully more robust against real registry drift, wrapped catalogs, and resource-style names than the initial landed helper.
5. Retrieval explainability is stronger on the maintainer lane because weak query derivation is now surfaced as structured diagnostics rather than an opaque empty-context outcome.
6. Sidebar operator feedback is again usable in the shipped UI because log output and API activity now share a bounded scrollable layout instead of fighting for fixed space.
7. Release workflow trigger truth is now contract-backed alongside release assets, notes, tag validation, workflow-source branch, and chronicle-target branch; this closes a YAML-local drift seam without pretending GitHub Actions can import repo code before checkout.

### 4.2 What remains structurally constrained

1. Packaging truth is still intentionally narrower than source organization.
2. Discovery remains transient by design; there is still no persisted remote model catalog.
3. The bounded discovery family set is broad enough to need discipline, but not broad enough to justify “generic provider discovery” claims.
4. Generic `OpenAI Compatible` still requires conservative ownership inference; beyond trusted hosts, explicit registry-provided owner hints, and explicit prefixes, token ceilings must remain unresolved.
5. Local host-side desktop verification is still stronger for plugin reload/state inspection than for fully scripted settings-panel click automation; this lane still relies on Jest to lock the exact `Fetch model list -> Use` notice/override branches.
6. Maintainer inspect explainability is intentionally richer than public CLI truth; that seam must remain bounded unless a future batch explicitly promotes it.
7. The repo-local maintainer CLI wrapper now has process-level regression coverage for its checked-in entrypoint semantics (`--input-json`, `--input-file`, `--pretty`, stderr passthrough, and eval-parse failure), so the bounded maintainer surface no longer relies only on bridge-level unit coverage.
8. The release / repo-saga helper lane now also has process-level regression coverage for its checked-in entrypoints, so current release-contract and chronicle-contract claims no longer rely only on helper-function tests and maintainer prose. That proof now explicitly covers:
   - release dry-run create/repair command shape;
   - chronicle refresh no-op / override / git-failure behavior;
   - repo-saga sync-only stamp hits, active-lock refusal, isolated generation, and invalid-argument fast-fail paths.

### 4.3 Main risk if the lane drifts now

The biggest risk is no longer lack of implementation. It is loss of boundary discipline.

Likely failure modes:

1. ad hoc provider-name special-casing starts replacing family-based shared logic;
2. docs begin overstating parity with Cherry Studio;
3. settings/discovery token guidance logic and runtime token-ceiling logic drift apart again;
4. a future “just persist the fetched list” shortcut silently creates a second provider-state subsystem.

### 4.4 Where the actual mainline bottleneck moved

After the latest provider closure, the highest-leverage unresolved bottlenecks are now adjacent lanes:

1. packaging / semantic-verification still carries the main source-vs-shipped-boundary ambiguity because source contains reusable runtime candidates while the shipped contract remains single-entry;
2. CLI / automation still carries a deliberate public-vs-maintainer split that has to stay explicit if any path-based operation is later promoted;
3. file-selection / local-KB / chapter-split Stage C now needs deeper evaluation coverage, mixed-corpus evidence, and example alignment, not another “does this feature exist?” recovery cycle.

## 5. Concrete Next Direction

Concrete execution plan for the next bounded batch:

1. **P0 packaging truth:** keep `main.js` plus inline `srcdoc` as the enforced shipped boundary until a same-batch build graph, release-asset, audit, and docs change intentionally promotes a real multi-entry runtime lane.
2. **P1 Stage-C quality:** extend `verify:local-kb-fixtures` with additional real-note/query shapes beyond the chapter-split showcase, while preserving current exact-file/folder, exclusion, failure-state, and task-scoped inspect coverage.
3. **P1 chapter split docs:** keep showcase docs and generated-artifact examples synchronized with deterministic TOC front matter, stable block refs, and guarded rerun semantics.
4. **P1 CLI boundary:** keep `local-knowledge.inspect` maintainer-only unless a separate public-promotion batch adds contract, help text, tests, and docs at the same time.
5. **P1/P2 provider maintenance:** keep provider/model-discovery additions on shared family and response-shape seams, with token-guidance scope stated explicitly for each change.

### Batch A: finish packaging / semantic-verification convergence before widening any claims

Priority: `P0`

Goal:

1. keep the current `main.js` + inline `srcdoc` shipping truth explicit and executable;
2. keep release workflow trigger, tag validation, asset, note, workflow-source, and chronicle-target truth under one shared contract;
3. keep the candidate-only production-build guard around latent render-host runtime candidates explicit before anyone widens packaging claims.

Required rule:

1. if a later batch wants a dedicated runtime asset again, build graph, release assets, audit logic, maintainer docs, and release docs must move together in the same batch.

### Batch B: keep bounded CLI / public-surface promotion separate and explicit

Priority: `P1`

Goal:

1. preserve the current split between bounded public-safe exports and explicitly maintainer-only path-based helper flows;
2. only promote any path-based operation when its contract, automation level, context requirements, tests, and docs all justify broader exposure.

Likely work:

1. keep `cli.public-surface.export` aligned with current registry metadata;
2. keep `npm run cli:help` and maintainer docs aligned with the bounded helper surface;
3. resist turning maintainer-only mutation/introspection seams into implied public CLI support.

### Batch C: deepen Stage-C quality on file selection / local-KB / chapter split without reopening existence questions

Priority: `P1`

Goal:

1. treat current-main retrieval and batch-input capabilities as landed product slices;
2. spend the next effort on broader corpus-quality evidence, maintainer examples, and regression depth instead of recovery rhetoric.

Likely work:

1. expand mixed file/folder, mixed query-shape, and exclusion-behavior fixture coverage where current contracts already justify it;
2. keep maintainer examples and retrieval-inspection guidance synchronized with the real task-scoped retrieval path;
3. preserve deterministic managed-artifact and rerun-guard semantics while broadening evaluation depth.
4. add tighter comparison guidance between the shipped retriever path and external reference projects only when that comparison can be grounded in the exact current Notemd task contracts, not generic RAG claims.

Current-main delta already landed during this Stage-C follow-through:

1. the offline fixture now also regression-locks task-scoped `batchGenerateFromTitles` and `researchSummarize` retrieval cases instead of treating diagram generation as the only maintainer inspect proof path;
2. maintainer helper help/examples now surface all three currently supported inspect query-derivation modes in practice: `basename`, `explicit`, and `diagram-source`;
3. exact-file-vs-folder configured knowledge-path boundaries are now checked in the same offline fixture lane, which reduces the risk of docs/examples drifting away from real retrieval behavior;
4. maintainer-side inspect failure states are now explicitly regression-locked as explainability truth as well: `no-paths`, `no-candidate-files`, and `no-retrievable-sections` stay distinguishable instead of collapsing into one generic “no context” outcome.
5. the offline fixture now also covers a noisy mixed-corpus scope case with duplicate/whitespace override paths, mixed file/folder entries, non-Markdown distractions, unrelated folders, and empty-section candidates, proving that the current MiniSearch path stays scoped without widening task count or public CLI behavior.
6. the offline fixture and maintainer helper examples now also cover a real-note-style chapter-split showcase query against managed artifacts, guarded reruns, and stable TOC block refs, using real docs-vault paths in the runnable inspect example instead of fixture-only paths.
7. the offline fixture now also covers real-note/query diversity beyond the chapter-split showcase: cross-folder project/reference knowledge paths, task-contract retrieval, RAG-quality evaluation notes, and navigation-like source diagnostics are locked without promoting `local-knowledge.inspect` into a public CLI contract.
8. maintainer help, the bilingual capability matrix, and the corresponding Jest alignment tests now also cover the same real docs-vault inspect examples: the explicit research query uses cross-folder `brainstorms` + `maintainer` knowledge paths, the batch-title example points at `brainstorms/2026-05-28-mainline-progress-audit-and-next-level-direction.md`, and the diagram-source example keeps `index.zh-CN.md` in the loop to prove low-signal navigation-source diagnostics. That moves Batch C example alignment from an open direction into a landed guardrail.
9. maintainer help, the bilingual capability matrix, and the offline runtime fixture now also carry reproducible docs-vault failure-state examples: an explicit empty override array now proves `no-paths` without depending on saved settings, and the `repo-saga` SVG-only folder now proves `no-candidate-files` on the real docs-vault shape instead of a synthetic-only fixture.

Next bounded direction for this batch:

1. when increasing real-note/query diversity beyond the chapter-split showcase, prioritize real task-contract failure states, low-signal queries, and noisy-corpus evidence before adding more demonstrative paths;
2. keep chapter split showcase/docs, maintainer examples, and the actual write contract aligned as managed-artifact/result schemas evolve;
3. keep maintainer inspect rich enough for diagnosis, but do not accidentally let that seam become the de facto public contract; if any path-based operation is ever promoted, do it in a separate public-promotion batch with same-batch schema/help/test/doc proof.

### Batch D: keep the provider lane in bounded breadth-maintenance mode

Priority: `P1/P2`

Goal:

1. continue widening support only through shared family semantics or wrapped-catalog shape support;
2. resist reintroducing provider-name-only branches unless the transport or discovery contract is genuinely distinct.

Required rule:

1. every new provider/discovery addition must specify family mode, header ownership, endpoint normalization, token-guidance behavior, and tests/docs in the same batch.
2. every change to discovered-model token autofill must explicitly state whether it affects:
   - global `Max tokens`
   - provider output-token override
   - both
   - neither

Current truth for this rule:

1. the current implementation affects provider output-token override only;
2. manual typed model changes remain the path that can still advance the global model-aware baseline when the user has not diverged from it.

### Batch E: keep documentation/tests and clean-state as ongoing guardrails

Priority: `P0`

Goal:

1. prevent future sessions from downgrading current-main truth back to outdated plan wording;
2. keep clean-state proof as a maintained invariant instead of letting it slip back into deferred cleanup debt.

Current audit reality:

1. the historical current-main closure was clean, but the present local branch is not clean at the start of this Slidev/GEO follow-through batch;
2. the dirty state includes generated `docs/export` artifacts, `docs/dist` churn, and Slidev export WIP that must not be reset or folded into unrelated commits blindly;
3. this batch's clean-state rule is therefore narrower: do not create or commit new generated test/export files, and keep the production/documentation delta separable from the pre-existing WIP;
4. the real next cleanup action is a controlled split: commit or stash intentional source/docs work, then explicitly discard or archive generated artifacts only after the owner confirms they are no longer needed for inspection;
5. the matrix, topic docs, README/change surfaces, and focused regression checks still act as the practical anti-drift guardrail.

Required follow-through:

1. re-check the current truth documents whenever packaging, CLI surface, or provider/discovery boundaries change;
2. keep `npm run build`, `npm test -- --runInBand`, `npm run audit:i18n-ui`, `npm run audit:render-host`, `git diff --check`, and either clean `git status --short --branch` or an explicit pre-existing-dirty ledger as the minimum closure bundle.

### Batch F: promote Slidev export from one-off smoke test to real workflow gate

Priority: `P0`

Background:

1. the real `docs/architecture.zh-CN.md` test exposed a gap in the old verification path: directly calling the Slidev CLI does not prove that the two UI export entries exercised NoteMD source preparation, full skill references, local fork selection, and output cleanup;
2. the old HTML docs still described server scripts as the only reliable path, which is no longer the current truth when the local fork supports standalone bundles;
3. generated artifacts need to remain inspectable instead of being hidden by `.gitignore` or cleaned too early.

Current WIP status:

1. `npm run verify:slidev-export` is now the stable maintainer entrypoint, defaulting to the real `docs/architecture.zh-CN.md` source;
2. the verifier and the real product export command now both call the production TypeScript `prepareSlidevExportSource()` plus shared `convergeSlidevDeckLayout()` workflow instead of keeping patch/rebuild logic verifier-only;
3. the JSON report records environment capability, local fork path, skill root, skill reference count, deck summary, Playwright samples, and `.gitignore` hits;
4. `docs/maintainer/slidev-export-workflow.*` now defines pass criteria, output policy, UI contract, and when to run the workflow;
5. `docs/SLIDEV_SOLUTION.md` and `docs/SLIDEV_HTML_FIX.md` now describe the current standalone-first, server-script-compatible truth, including the stricter `--require-native-standalone` gate.
6. the current source-preparation prompt uses the full skill references, asks the model to split dense prose/table/code, and explicitly preserves Mermaid source fences; the only remaining static Mermaid zoom heuristic is now a missing-value seed, not an overwrite of explicit per-slide `zoom`; on re-export, whole-slide `zoom` comes from measured safe-rect overflow while local `<Transform>` scale comes from slot-owner geometry and scroll overflow.
7. `node scripts/verify-slidev-export-workflow.cjs --json` can now prove, on the real `docs/architecture.zh-CN.md` input, that:
   - the workflow resolves `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`
   - the workflow resolves `/home/jacob/slidev/skills/slidev`
   - the workflow reuses Jacob's Playwright browser cache
   - full-deck HTML slides go through visible-root layout audit plus bounded measured patch/rebuild
   - the `HTML`, `PDF`, and `PNG` export paths are live and now all export from the same converged prepared deck
   - the real HTML fixture now closes with strict native standalone `ok: true`, `actualMode = "standalone"`, `standaloneGate.passed = true`, `28` audited slides, `overflowCount = 0`, and `retryCount = 4`
   - maintainer-local structural overflow notes can now converge through real Markdown table decomposition and code-fence chunking rather than only unit-test rewrites
   - compatibility fallback remains observable through `htmlExport.actualMode = "server-script-fallback"` and preserved `index-standalone.failed.html` evidence when a future native bundle has real loader gaps
8. `docs/maintainer/slidev-standalone-acceptance-2026-06-18.*` now records the dedicated strict standalone acceptance package for the real `architecture.zh-CN.md` run: report path, archived output path, local fork evidence, full skill-reference evidence, layout-audit summary, the earlier `$n` false-positive diagnosis, and the explicit policy that the large generated HTML/screenshots stay under `/home/jacob/slidev-export-review/2026-06-18/standalone-strict/` instead of being committed to `main`.

Next direction:

1. Slidev export changes must include `npm run verify:slidev-export` in closure evidence;
2. generated `docs/export/` files may remain available for local inspection, but should not be committed unless the task explicitly asks for generated output; real acceptance artifacts can be archived outside the repo, for example under `/home/jacob/slidev-export-review/`;
3. keep `SlidevRenderedMeasure`, `SlidevOverflowAudit`, and `SlidevDeckPatch` as explicit owned modules and extend them rather than letting logic leak back into prompt heuristics;
4. the next step is no longer “add table/code decomposition at all”; it is to extend the current patcher toward custom layout-safe splitting, richer component slides, and pathological cell/content fallback handling while preserving deterministic failure modes;
5. product-smoke evidence still has one host limitation: `obsidian command id=notemd:export-slides` proves command dispatch, but the Obsidian CLI still does not expose an export-complete handshake, so verifier JSON remains the stronger closure signal;
6. any upstream Slidev skill PR should stay generic: full references, built-in/configured theme preference, closed frontmatter, readable transforms for large diagrams/tables/code, and browser-sampled build verification. NoteMD vault paths, local fork paths, layout audit internals, and the `architecture.zh-CN.md` fixture should remain project-local.
7. standalone acceptance should now be treated as a tracked maintainer evidence package, not as an implicit chat summary: if the strict report or archived output path changes, update `docs/maintainer/slidev-standalone-acceptance-2026-06-18.*` or create a new dated acceptance file in the same shape.

### Batch G: gate GitHub Pages language and GEO output

Priority: `P0/P1`

Background:

1. the 2026-06-17 Pages pass fixed missing root pages, stale language claims, sitemap filtering, and `llms.txt`, but it still relied mostly on source review plus `npm run build`;
2. the real generated zh-CN homepage still exposed `/obsidian-NotEMD/zh-CN/docs/intro`, `/zh-CN/docs/getting-started/quick-start`, `/zh-CN/docs/providers/overview`, and `/zh-CN/docs/pillar-ai-knowledge` as user-facing links even though those pages are untranslated fallback docs;
3. that means crawler protection was better than user-facing language truth: `noindex,follow` and sitemap filtering cannot compensate for a Chinese homepage that routes users into English fallback pages.

Current landed status:

1. `website/src/lib/publishedLanguageScope.js` now owns the published zh-CN doc scope: currently only `faq`;
2. `website/docusaurus.config.js` consumes that scope for sitemap filtering and uses canonical English URLs for the navbar/footer docs entry where untranslated zh-CN docs must not be implied;
3. `website/src/theme/DocItem/Layout/index.js` consumes the same scope for fallback-doc `noindex,follow`;
4. `website/src/pages/index.js` consumes the same scope so zh-CN homepage links FAQ to `/zh-CN/docs/faq` and routes untranslated critical docs to canonical English URLs;
5. `website/scripts/audit-build.cjs` now audits the built output for root pages, canonical/WebPage JSON-LD URLs, zh-CN homepage route truth, noindex fallback behavior, sitemap language scope, and `llms.txt` language markers;
6. `website/package.json` exposes `npm run audit:build`, and `.github/workflows/deploy-docs.yml` runs it after `npm run build` before uploading the Pages artifact;
7. `docs/maintainer/github-pages-language-geo-workflow.*`, `website/README.md`, and `GEO_ROADMAP.md` now describe the deploy gate and the promotion rule for future zh-CN translations.

Next direction:

1. do not add locales as GEO surface area until the critical path is translated and reviewed;
2. promote future zh-CN docs by updating the translation and `publishedLanguageScope.js` in the same batch, then running `npm --prefix website run build && npm --prefix website run audit:build`;
3. after the route/language gate stays stable, add a provider-page quality audit for thin pages; this is a content-depth problem, not a locale-routing problem;
4. keep `website/build` and generated Slidev export artifacts out of source commits.

### Batch H: move Slidev export from hard visibility to presentation quality

Priority: `P0`

Background:

1. Batch G already proved the real UI-equivalent export path, full Slidev skill references, local fork usage, strict standalone, and full-deck rendered audit;
2. the real `architecture.zh-CN.md` output still exposes the next bottleneck: low-zoom slides can avoid clipping while still being poor presentation material;
3. the useful reference from `ref/infinite-canvas` is world rectangles, union bounds, viewport fit, and node geometry, not its UI or AGPL-3.0 implementation code.

Current status:

1. `convergeSlidevDeckLayout()` is the shared final fact gate for product export and maintainer verification;
2. `slidevLayoutAudit.ts` now supports rendered bounding boxes, scroll overflow, slot-zone owner geometry, effective font, SVG/table/code minimum font, quality margins, and content-area ratio;
3. `docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md` now tracks the detailed route, comparing previous requirements, current code, useful `ref/infinite-canvas` concepts, real-output gaps, and the implementation order;
4. `src/slideExport/slidevLayoutPlan.ts` now carries the clean-room layout budget that translates world-rect / viewport-fit ideas into NoteMD-owned `SlideLayoutPlan` logic, and source preparation feeds that budget into deterministic outlines, one-shot export prompts, and outline-continuation prompts;
5. low effective font, tight margins, and low content utilization now create structural `recommendedPatch` findings for table/code/prose; Mermaid source fences are preserved by default, with fit metrics recorded instead of auto-splitting the original diagram;
6. `docs/SLIDEV_SOLUTION.*` and `docs/maintainer/slidev-export-workflow.*` now state that the hard gate and quality gate must be reported separately.

Next direction:

1. Stage 1/2 have landed as a first slice; the next gate is real `architecture.zh-CN.md` strict-standalone validation and threshold calibration;
2. Stage 3/4 should deepen source-preserving Mermaid fit/manual-review evidence, cell-level table rewrite, and code semantic excerpts instead of falling back to fixed zoom values;
3. Stage 5 should keep expanding fixtures to cover large flowcharts, long sequence diagrams, wide/tall tables, mixed code/table slides, component-heavy slot layouts, and the real `architecture.zh-CN.md`;
4. every implementation slice must retain strict standalone and full-deck browser audit instead of regressing to CLI-only or representative sampling.

## 5.1 2026-07-02 Mainline CI / GEO / CLI / Slidev Closeout

This batch closes a different class of risk than the earlier layout-quality and provider-control-plane batches. The new root problem was not that Slidev layout convergence regressed. It was that the environment probe and adjacent maintainer/release helpers still had platform-specific command-resolution assumptions.

### Remote Main CI Finding

Remote `main` did not have a current source/build failure at the investigation baseline:

1. the latest listed `Deploy Docusaurus to GitHub Pages` runs on `main` were successful;
2. the recent failure run investigated in detail, `27451762938`, failed in `actions/deploy-pages@v4` with `HttpError: Not Found` and the explicit instruction to enable GitHub Pages;
3. current `eb777ef` had no check-runs attached, and the legacy status endpoint had no statuses, so the apparent pending legacy status was not a failing CI context.

Interpretation:

1. the historical remote failure was a Pages settings/deployment availability problem, not a Docusaurus build or `audit:build` source failure;
2. Pages deployment remains a hard gate whenever `website/**` or `.github/workflows/deploy-docs.yml` changes;
3. this batch should still push a new `main` change and watch the Pages workflow if website files are touched.

### Cross-Platform Command Architecture

The current implementation now uses one command-resolution model for plugin Slidev probing and Node maintainer scripts:

| Requirement | Current implementation | Status |
|---|---|---|
| POSIX shell behavior must not regress | Linux/macOS keep direct exec first and do not get a shell wrapper for normal commands | Closed |
| Windows `.cmd` / `.bat` shims must work | Windows resolves command names through `PATH` + `PATHEXT` and uses an isolated quoted `cmd.exe /d /s /c call` path only for resolved batch files | Closed |
| Windows argument fidelity must survive JSON/code payloads | No blanket `shell: true`; `.exe` / `.com` run directly and Node scripts run through `process.execPath` | Closed |
| Release/repo-saga/maintainer helper scripts must share the same rules | `scripts/lib/cross-platform-command.js` centralizes the Node-side process contract | Closed |
| Slidev HTML output path detection must handle OS separators and modern Slidev output shapes | `src/slideExport/htmlExportPaths.ts` centralizes `index.html` discovery and path normalization | Closed |

The design choice is deliberate: Windows needs a batch-shim adapter, but Linux and macOS already work through direct exec. Using shell on Windows globally would make the original `spawn EINVAL` disappear while introducing a harder-to-debug argument-corruption class.

### GEO And GitHub Pages Progress

The website architecture is already stronger than the original GEO roadmap required:

1. root and zh-CN root pages exist;
2. `llms.txt`, sitemap filtering, homepage JSON-LD, partial-language copy, provider-doc heading gates, and measurement logs are all covered by `website/scripts/audit-build.cjs`;
3. zh-CN critical-path pages and UI chrome are translated, while fallback pages remain `noindex,follow` and out of the zh-CN sitemap.

The remaining work is not another source-only route rewrite. It is live measurement:

1. submit or refresh root and zh-CN sitemaps in Search Console;
2. inspect root, zh-CN root, FAQ, provider overview, one provider detail, and one unpublished zh-CN fallback;
3. rerun English and Chinese answer-engine prompts after crawl;
4. update the measurement log with exact dates, engines, prompts, citations, and route results.

### Updated Next Direction

The next engineering direction is narrower than "finish GEO and CLI" as a broad slogan:

1. keep public CLI promotion blocked until path-based write operations have explicit public schemas, side-effect docs, deterministic failure modes, and user-facing docs;
2. keep Slidev export verification UI-equivalent and browser-rendered; do not regress to `slidev build` alone;
3. keep Pages truth gated on built output, not source review alone;
4. treat any future semantic/vector local-KB expansion as a new architecture decision, not an implication of current MiniSearch lexical retrieval;
5. keep release/repo-saga/maintainer scripts on the shared cross-platform process adapter instead of reintroducing ad hoc `spawn`, `execFile`, or shell-only calls.

## 5.2 2026-07-03 Repository doc truth/layout alignment

The repository root had accumulated too many one-off status, migration, and investigation notes that were no longer the best entrypoint for current-main truth.

Current closure direction is now explicit:

1. `docs/README.md` is the canonical documentation hub.
2. `DOCUMENTATION_INDEX.md` at the root is now only a thin entrypoint instead of a duplicate long-form catalog.
3. historical root reports move to `docs/archive/root-history/` rather than continuing to live beside `README.md`.
4. `GEO_ROADMAP.md` intentionally stays at the root for now because current website audit/test flows still read that path.
5. active truth for this lane belongs in canonical progress docs, maintainer docs, and bounded roadmap/closeout docs under `docs/`.

This is not cosmetic cleanup. It changes the operational rule for future batches:

1. update the canonical progress docs under `docs/` instead of dropping new root summaries;
2. treat root-doc sprawl as a regression in repository truth maintenance, not as harmless note-taking.

## 5.3 2026-07-22 Drawnix export-quality truth

The Drawnix target is present in current code, but the target quality is narrower than earlier progress language implied. `DrawnixRenderer` currently receives the generic `SemanticFigureModel`: nodes are flattened into a fixed three-column rectangle grid, `DiagramNode.children` is lost, and SVG preview is rendered by the generic editable-SVG path. The generated architecture artifact therefore proves JSON-envelope compatibility only; it does not prove a Drawnix knowledge-map canvas.

This changes priority in a bounded way:

1. full Drawnix host embedding remains rejected;
2. public claims for generic Drawnix support must be narrowed to the implemented subset until replacement lands;
3. the next Drawnix delivery is a target-specific editable mind-map projection, not another general renderer or a string-converter shortcut;
4. architecture-canvas output remains a later decision because it needs separate grouping, routing, and collision semantics;
5. existing Obsidian CLI invocation is the integration-verification path, not a reason to broaden the public CLI contract.

The detailed code/plan comparison, delivery sequence, prompt contract, and verification matrix are in `docs/brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.md`.

## 6. Documentation Sync Rule

Any future change that updates the provider-settings/model-discovery lane must re-check, at minimum:

1. `change.md`
2. `README.md`
3. `README_zh.md`
4. `docs/brainstorms/2026-05-20-unified-follow-through-matrix.*`
5. `docs/brainstorms/2026-05-27-provider-settings-simplification-and-model-discovery-plan.*`
6. this audit document

Any future change that updates the Slidev export lane must re-check, at minimum:

1. `docs/maintainer/slidev-export-workflow.*`
2. `docs/maintainer/slidev-standalone-acceptance-2026-06-18.*` or the newest dated standalone acceptance file
3. `docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md`
4. `docs/SLIDEV_SOLUTION.md`
5. `docs/SLIDEV_HTML_FIX.md`
6. `src/slideExport/*`
7. `src/main.ts`
8. `src/ui/NotemdSettingTab.ts`
9. `src/ui/NotemdSidebarView.ts`
10. `package.json`

Any future change that updates the GitHub Pages / GEO / website language lane must re-check, at minimum:

1. `GEO_ROADMAP.md`
2. `website/README.md`
3. `website/docusaurus.config.js`
4. `website/src/lib/publishedLanguageScope.js`
5. `website/src/pages/index.js`
6. `website/src/theme/DocItem/Layout/index.js`
7. `website/static/llms.txt`
8. `website/scripts/audit-build.cjs`
9. `.github/workflows/deploy-docs.yml`

## 7. Verification Gate

Any update that changes the truth claims in this document should still finish with:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. clean `git status --short --branch`

If the update touches Slidev export, also run:

1. `npm run verify:slidev-export`
2. `npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevLayoutPlan.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slidevLayoutWorkflow.test.ts src/tests/slideExportComprehensive.test.ts`

Slidev export closure must also include a non-empty layout-audit report for `docs/architecture.zh-CN.md` with zero `overflow` and zero `unreadable-scale` findings. After Batch H lands, closure should additionally check effective-font, quality-margin, content-area-ratio, and pre/post split metrics instead of accepting low `zoom` as the final quality fix.

If the update touches GitHub Pages / GEO / website language scope, also run:

1. `npm --prefix website run build`
2. `npm --prefix website run audit:build`

## 8. Bottom Line

Current `main` no longer needs another “did the provider settings lane really land?” argument.

The real current questions are now:

1. can packaging/source organization and shipped render-host truth stay aligned without overclaiming a runtime topology that current main does not ship;
2. can the current bounded CLI split stay explicit while any future path-based promotion remains contract-first rather than convenience-first;
3. can Stage-C local-KB / file-selection / chapter-split work deepen mixed-corpus quality evidence instead of relitigating feature existence;
4. can the widened bounded provider discovery surface remain shared-core, lightweight, and honest as a maintenance lane rather than becoming the excuse for broader architectural claims;
5. can Slidev export keep using a real UI-equivalent workflow proof and move from hard overflow gates into effective-font / quality-margin / layout-planning gates instead of regressing to “the CLI can build, so the buttons must work” or “it fits after zoom, so it is readable” as weak evidence;
6. can GitHub Pages keep route, sitemap, canonical, `llms.txt`, and visible language entry points aligned through a build-output gate instead of source-only review;
7. can current truth documents keep tracking the real shipped branch boundary quickly enough that future sessions do not regress back to `1.9.0/1.9.1`-era wording.
