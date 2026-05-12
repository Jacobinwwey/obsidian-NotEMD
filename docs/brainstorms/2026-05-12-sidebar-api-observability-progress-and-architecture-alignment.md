---
date: 2026-05-12
last_updated: 2026-05-12
topic: sidebar-api-observability-progress-and-architecture-alignment
---

# Sidebar API Observability: Deep Comparison, Progress, And Next Direction

## 1. Scope And Requirement Baseline

This document lands the concrete plan, shipped implementation truth, and next-direction assessment for the sidebar API observability slice.

Primary requirement sources:

1. the product request to expose a quick `Deep debug` toggle directly in the footer `Log output` area
2. the product request to show a visible API liveness indicator in the ready/progress card, including:
   - waiting for API output
   - normal output reception
   - long-running but healthy task messaging after 30 seconds
   - successful response receipt
   - interrupted output
3. the explicit requirement to preserve existing shipped behavior and prioritize stability/robustness over surface-level feature expansion
4. the repo’s broader stabilization discipline in `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`

Delivery goals for this slice:

1. reduce user anxiety by exposing visible response-health feedback in the sidebar
2. make deep debugging reachable without forcing a settings-page round trip
3. keep transport semantics honest: do not overclaim what buffered/non-streaming providers can prove
4. avoid regression across single-file, batch, folder, and retry-heavy provider paths

## 2. Pre-Change Reality And Root Cause Analysis

Before this slice, the plugin had useful debug and progress primitives, but they were not surfaced in a way that matched real support/debug workflows:

- `enableApiErrorDebugMode` existed only as a settings toggle, which is too slow for rapid issue triage
- sidebar progress state could show generic task progress, but it could not answer the user’s actual question: “is the provider currently returning anything, or is the task stuck?”
- retry attempts and terminal failures shared the same coarse failure shape at the UI boundary
- batch/folder flows wrap mini-reporters around per-file work, which meant any new observability channel could silently disappear unless it was explicitly forwarded

Root-cause summary:

1. **debug reachability was too indirect**
   the diagnostic toggle existed, but not in the place where users inspect logs during a live run
2. **provider-response observability stopped at the runtime layer**
   transports could infer response timing, but the sidebar had no contract to receive or render that information
3. **failure semantics were too coarse**
   a retryable attempt failure and a final interruption could both look like “error” unless the UI was given retry-aware state
4. **parallel/batch execution introduced aggregation risk**
   a single global status field would be fragile under concurrent requests or per-file reporter wrappers

## 3. Implementation Mapping (Requirement -> Code Evidence)

| Requirement / Need | Code evidence | Status |
|---|---|---|
| Quick sidebar `Deep debug` toggle | `src/ui/NotemdSidebarView.ts` footer log header toggle | Landed |
| Persist toggle into real plugin settings | `enableApiErrorDebugMode` write-through via `plugin.saveSettings()` | Landed |
| Show success-path raw-response debug, not error-only debug | `logSuccessfulApiDebug()` in `src/llmUtils.ts` | Landed |
| Reuse existing sanitized debug schema instead of inventing a second one | `getDebugInfo()` + shared runtime debug attempts | Landed |
| Sidebar liveness event contract | `ApiLivenessEvent` / `ProgressReporter.updateApiLiveness()` in `src/types.ts` | Landed |
| Emit liveness on real streaming chunk reception | `requestViaWebFetch*StreamTransport` and `requestViaDesktopHttp*StreamTransport` paths in `src/llmUtils.ts` | Landed |
| Emit conservative response-arrival signal for non-streaming providers | `executeAnthropicApi`, `executeGoogleApi`, `executeAzureOpenAIApi`, `executeOllamaApi`, and OpenAI-compatible success path | Landed |
| Distinguish retrying failure vs terminal interruption | `callApiWithRetry()` emits `request-error` with `retrying: true/false` | Landed |
| Prevent concurrent requests from prematurely flipping sidebar into a completed/error state | `apiActiveRequestCount` + `apiReceivingRequestCount` aggregation in `src/ui/NotemdSidebarView.ts` | Landed |
| Forward liveness events through batch/folder mini-reporters | `src/fileUtils.ts` and `src/operations/noteProcessingCommandHostAdapter.ts` | Landed |
| Preserve i18n coverage for new sidebar copy | `src/i18n/locales/en.ts`, `zh_cn.ts`, `zh_tw.ts` | Landed |
| Lock behavior with focused regression tests | `src/tests/sidebarDomButtonClicks.test.ts`, `llmUtilsProviderSupport.test.ts`, `noteProcessingCommandHostAdapter.test.ts` | Landed |

## 4. Architecture Advancement Assessment

This slice advances the repo in a useful but intentionally bounded way:

1. **Settings-only diagnostics -> runtime-adjacent diagnostics**
   debug control now lives where users inspect live logs, without reopening global settings architecture
2. **transport evidence -> explicit UI contract**
   provider-response timing is now surfaced through a typed progress-reporter channel instead of ad hoc log parsing
3. **coarse failure state -> retry-aware failure semantics**
   transient attempt failure no longer has to masquerade as a final broken task
4. **single-run assumption -> concurrent aggregation**
   sidebar liveness rendering now tolerates overlapping requests instead of assuming exactly one request owns the footer state

What this slice does **not** do:

1. it does not add request-level IDs or a per-provider live timeline
2. it does not claim that buffered/non-streaming providers can prove ongoing body emission before the full response object exists
3. it does not change provider protocol semantics or broaden packaging/runtime topology

## 5. Deep Comparison Against Prior Plan Tracks

### 5.1 Against `mainline-stabilization-next-batch`

Alignment:

1. this is a stability/operability hardening pass, not a speculative product expansion
2. the slice keeps the same landing rule used elsewhere in the plan: typed contract -> focused tests -> full gates -> doc sync
3. it strengthens shipped support/debug workflows without reopening unrelated runtime-packaging decisions

Difference:

- this slice hardens the product-observability boundary rather than the packaging/release boundary

### 5.2 Against release-chronicle / CI hardening work

Alignment:

1. the same anti-drift pattern is used: centralize truth in repo-owned code, then lock it with targeted tests
2. the same evidence-first closeout rule remains intact: full build/test/audit/diff/Obsidian wrapper checks all still apply

Difference:

- this slice improves user-visible runtime observability, whereas the release-chronicle work improved maintainer-visible release recovery

### 5.3 Against packaging / semantic-verification convergence

Alignment:

1. both tracks are boundary-hardening work
2. both tracks explicitly avoid overclaiming the current architecture
3. both tracks treat docs/tests/code as a single truth surface

Difference:

- this slice does not start Stage-C packaging topology work
- it should not be misread as evidence that heavy-runtime isolation or per-request semantic verification is already solved

## 6. Non-Streaming Semantics Truth

This is the most important implementation truth to preserve in docs and future work.

### 6.1 Streaming providers / transports

For streaming-capable paths, `response-chunk` means the runtime has actually received response bytes/chunks from the provider transport.

That is a real liveness signal.

### 6.2 Buffered / non-streaming providers

For buffered/non-streaming paths, the runtime generally cannot prove “provider is still actively generating output” before the full response object arrives.

Current behavior is intentionally conservative:

1. `request-start` moves the sidebar into waiting state
2. the UI remains in waiting state while no verifiable response data is available
3. once the response object is actually available, the runtime emits a conservative response-arrival signal (`response-chunk`) and then completes

Implication:

- the current green “receiving output” semantics are strongly meaningful for streamed paths
- for buffered paths, the implementation only claims response arrival once the response exists; it does **not** speculate about server-side health during the wait window

This is the correct tradeoff for now. Anything stronger would require additional protocol evidence such as request IDs, response headers timing, or dedicated server-side heartbeats.

## 7. Risk Register And Controls

1. **Risk:** retryable attempt failures flash as terminal errors and mislead users.
   **Control:** `retrying` is now explicit in `request-error`, and the sidebar keeps retryable failures out of the final red-state path.
2. **Risk:** one completed request incorrectly ends the liveness indicator while another request is still active.
   **Control:** sidebar state now aggregates active/receiving counts instead of rendering from a single scalar flag.
3. **Risk:** batch/folder mini-reporters drop the new liveness channel.
   **Control:** liveness forwarding is explicitly wired through mini-reporters and locked by host-adapter regression coverage.
4. **Risk:** docs or UI copy overclaim buffered/non-streaming health semantics.
   **Control:** this document and the code both keep non-streaming behavior described as conservative response-arrival, not speculative “healthy output in progress.”
5. **Risk:** future transport refactors break observability without obvious user-facing errors.
   **Control:** transport/provider support tests now assert liveness emissions directly rather than only final returned text.

## 8. Verification Evidence

Executed and passed:

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help`

Focused regression coverage added/updated:

1. sidebar liveness state transitions, long-wait messaging, and quick debug toggle persistence
2. retry-aware liveness emission in provider runtime support tests
3. batch concept-extraction path forwarding of per-file liveness events back to the main reporter

## 9. Current Progress And Next Direction

Current status on `main` after this slice:

1. quick deep debug is reachable from the live log surface
2. sidebar liveness now reflects waiting / receiving / healthy-long-running / received / interrupted states
3. retry semantics and concurrent-request aggregation are hardened enough for normal shipped usage
4. batch/folder workflows no longer silently lose the liveness signal

Recommended next direction:

1. **Introduce request-level identity**
   move from aggregate counters to `requestId`-keyed state so overlapping requests can be reasoned about precisely
2. **Separate header/acceptance vs body-reception states**
   add a distinct state for “request accepted / response headers received” rather than overloading `receiving`
3. **Keep buffered-provider claims conservative**
   do not promote non-streaming long-wait states into green “healthy output” messaging unless transport evidence truly exists
4. **If deeper support tooling is needed later**
   prefer per-request structured observability over more global sidebar condition branches

## 10. Conclusion

This slice is a good stabilization landing, not because it adds more UI, but because it makes the UI tell the truth more precisely:

- deep debug is faster to reach
- retries do not masquerade as terminal failure
- concurrent requests do not prematurely collapse the footer state
- non-streaming providers are treated conservatively rather than theatrically

That keeps the feature supportable on `main` today, while leaving a clean path for future request-level observability.
