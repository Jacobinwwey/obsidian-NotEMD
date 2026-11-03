# Archify-informed diagram quality implementation plan

[中文](./2026-10-18-er-quality.zh-CN.md)

## Goal and design

Improve the ER generation chain, not only its colors. Retain the existing diagram catalog, source formats, previous fixes and user settings. Design direction: restrained technical editorial tables, clear header/field hierarchy, readable types and key badges, orthogonal relationships and source-backed cardinalities. No new network fonts, runtime dependency, credentials, provider call or copied Archify runtime.

The user authorized implementation of the recommended improvements. Alternatives considered: theme-only work cannot recover missing schema semantics; embedding Archify introduces another runtime/schema/security boundary; a first-class ER payload and shared ER scene provide the smallest complete semantic owner. Other diagram families keep their current engines; their prioritized roadmap will distinguish implemented work from proposals.

## Phases

- [x] 1. Pin a fresh Archify clone and compare schema, generation guidance, scene geometry, routes, legends and actual artifacts.
- [x] 2. Write failing regressions for canonical ER validation, bilingual identities, SQL types, composite key roles, FK references, cardinality, source-only unknowns and old payload compatibility.
- [x] 3. Add one ER semantic boundary consumed by Mermaid, HTML/SVG and Draw.io; require known references and do not invent fields. Preserve legacy inputs with explicit compatibility disclosure.
- [x] 4. Add a measured ER table scene, obstacle-aware orthogonal routes, endpoint markers and non-truncating text. Export attributes as table rows, not standalone entities. Use the same scene for SVG and native Draw.io.
- [x] 5. Strengthen generation guidance and replace the minimal ER sample with a real schema; keep preview/export consistency and prior fit/selection fixes.
- [x] 6. Run targeted red/green tests, browser geometry/theme/accessibility checks, production build, full tests and lint/audits. Record unknown UX evidence rather than inventing scores.

Verification execution is complete, not an all-green release signoff: 324 non-release suites pass (3103 passed tests, one skipped), while the separately rerun untouched release fixture still has five child-timeout/cleanup failures and five non-ER gallery archives remain stale. See the bilingual maintainer report for the original unfiltered full-run counts, export evidence and native-consumer limitations.

## Ownership and verification

ER contracts/compatibility belong under `src/diagram/adapters/er/`; canonical registration belongs in `payloads/types.ts` and `payloads/validators.ts`. Renderer entry points only dispatch complete ER operations. Prompt/catalog/example updates share that contract. Tests exercise actual exported formats and real browser SVG geometry. No commit, branch change, release, dependency upgrade, original-note overwrite or `.trellis` cleanup. Existing uncommitted changes from prior repairs are retained.

The previous full run has an unrelated release fixture with a 20-second child timeout; report fresh results honestly rather than changing that release code.
