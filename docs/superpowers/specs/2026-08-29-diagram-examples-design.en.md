---
date: 2026-08-29
last_updated: 2026-08-29
topic: diagram-examples
status: approved
canonical_for:
  - diagram-examples
  - real-vault-diagram-evidence
supersedes: []
superseded_by: null
implementation_plan: docs/superpowers/plans/2026-08-29-diagram-examples-implementation.en.md
---

# Diagram Examples And Real-Vault Evidence Design

## Decision

Create a catalog-driven learning and evidence tree at `docs/diagram-examples/`. The tree contains one directory for every executable diagram catalog ID (33 at the time of this design), bilingual input notes, and visual/artifact outputs captured from a real generation run in the configured `E:\1Knowledge` Vault.

The directory is deliberately separate from `docs/assets/diagrams/`. The existing gallery is a deterministic fixture gallery for product preview coverage; this new tree is a learning set and an integration record. A result in this tree is labelled real-vault evidence only when the plugin's provider-backed generation command completed and the copied files came from that run.

The implementation is a small catalog-driven orchestrator around existing command and export boundaries. It must not introduce a second diagram renderer, copy reference screenshots, or duplicate fixture semantics in a hand-maintained list.

## Goals And Non-Goals

Goals:

- Provide one bilingual input Markdown note for every executable catalog type.
- Exercise every type through the configured provider in the running `E:\1Knowledge` Vault.
- Preserve the generated artifact and the visual evidence needed to inspect the result quickly.
- Make each example useful as a user learning reference: explain the intended source facts, selected type, target, and expected reading cues.
- Make the run repeatable and auditable through a manifest, per-example machine-test record, hashes, and a `check` mode.
- Keep the repository portable by storing vault-relative paths and redacted runtime metadata only.
- Add bilingual documentation navigation so the new material is discoverable from the docs site.

Non-goals:

- Replacing the existing static gallery or its fixture-generation pipeline.
- Claiming Draw.io, Drawnix, Circuitikz, or any other external consumer compatibility without an existing consumer gate.
- Committing provider credentials, full local filesystem paths, request bodies containing secrets, or raw provider logs.
- Adding a new diagram DSL or changing the diagram catalog, renderer contracts, or preview UI.
- Treating a failed provider run as a successful example by silently falling back to a fixture.

## Directory Contract

```text
docs/diagram-examples/
  README.md
  README.zh-CN.md
  manifest.json
  <type-id>/
    input.md
    input.zh-CN.md
    result.svg
    result.png
    artifact.<target-extension>
    machine-test.json
```

`<type-id>` is the stable ID from `EXECUTABLE_DIAGRAM_TYPES`; it is not a display title or a fixture ID. The implementation must create exactly one directory per executable ID and reject duplicate or missing IDs.

Each per-type file has one responsibility:

- `input.md` is the English source note submitted to the provider.
- `input.zh-CN.md` is the semantically equivalent Simplified Chinese source note. It preserves the same facts, identifiers, and expected relationships while translating explanatory prose.
- `artifact.<target-extension>` is the primary artifact written by the real command. The extension is resolved from the selected render target descriptor; it is not guessed from the semantic type.
- `result.svg` is the copied SVG visual companion when the real run provides one. For a target that already writes SVG, it is the primary visual result. If a target cannot produce SVG, the record must state that explicitly rather than inventing a conversion.
- `result.png` is the copied raster visual companion when the real run provides one. PNG rasterization must use the existing export path and stable export settings.
- `machine-test.json` records the run contract, status, metadata, and diagnostics for that type. It contains no credentials or unredacted provider payloads.

The top-level `README` files explain the workflow, status vocabulary, how to read an input/output pair, and links to all 33 examples. They are sibling English/Chinese files, matching the repository's existing documentation convention.

## Manifest Schema

`manifest.json` is the machine-readable index and the source for `check` mode. Its additive schema is:

```ts
interface DiagramExamplesManifest {
    schemaVersion: 1;
    generatedAt: string;
    catalogSource: 'src/diagram/diagramTypeCatalog.ts';
    expectedCount: number;
    entries: DiagramExampleManifestEntry[];
}

interface DiagramExampleManifestEntry {
    typeId: string;
    fixtureId: string;
    title: string;
    intent: string;
    target: string;
    inputPath: string;
    inputZhPath: string;
    artifactPath: string | null;
    svgPath: string | null;
    pngPath: string | null;
    status: 'passed' | 'failed' | 'unavailable';
    providerId: string | null;
    model: string | null;
    generatedAt: string | null;
    artifactSha256: string | null;
    svgSha256: string | null;
    pngSha256: string | null;
    sourceNotePath: string | null;
    diagnostic: string | null;
}
```

The manifest stores repository-relative documentation paths. `sourceNotePath` is a Vault-relative path under a dedicated temporary/evidence prefix and is removed from the Vault after copying; it is retained only as a logical identifier. Absolute paths, API URLs containing credentials, authorization headers, and raw error responses are forbidden. Provider and model names are retained because they are useful evidence and are not secrets.

`generatedAt` is informational and must not make `check` fail by itself. Hashes, type membership, file existence, status, and path consistency are hard checks. A failed or unavailable entry is valid evidence but makes the generation command exit non-zero unless the caller explicitly selects a reporting-only mode; `check` always reports it.

## Source And Generation Flow

The generator follows this flow for each catalog row in catalog order:

```text
catalog row + example fixture semantics
  -> bilingual input Markdown
  -> temporary Vault source note
  -> maintainer diagram.generate with requestedTypeId + requestedRenderTarget
  -> provider-backed artifact and companion discovery
  -> copy artifact/SVG/PNG into docs/diagram-examples/<type-id>/
  -> write machine-test record and manifest entry
  -> delete temporary source and generated Vault files
```

The input note is derived from the catalog-owned executable fixture contract, not from a copied gallery image. The generated request must pass `requestedTypeId` and the row's declared default target (or an explicitly documented compatible target). This prevents planner inference from silently producing a different type. The operation remains the existing host-neutral `diagram.generate` contract invoked through the maintainer bridge and official Obsidian `eval` fallback.

The generator may use a short-lived local staging directory for request payloads and copied outputs. Staging paths are outside the Vault and are removed after each example or at the end of the run. The running Obsidian plugin is reloaded only through the already-verified official CLI `eval` disable/enable sequence when a bundle reload is required; the generator must not rely on the unreliable `plugin:reload` command.

Result discovery uses the operation's returned `outputPath` and follow-through metadata first, then the existing companion conventions used by `diagramCommandHostAdapter.ts`. It must verify that every copied result belongs to the current source note and type before writing it. A stale file from a prior run is never accepted as current evidence.

## Status And Error Handling

Each example has one terminal status:

- `passed`: provider-backed generation completed, the requested type/target matched, at least the primary artifact or visual companion was copied, and presentation validation passed.
- `failed`: the provider or renderer returned an error, the output was malformed, the requested type/target mismatched, or a required copy/hash check failed.
- `unavailable`: the configured provider or target cannot execute in the current Vault/runtime. This is an explicit limitation, not a pass.

Failures are isolated per type so the run records all attempted types. The process exits non-zero after writing records and performing cleanup when any type is `failed` or `unavailable`. Cleanup runs in `finally` and is idempotent: only files under the generator's dedicated temporary prefix may be removed. Existing user notes and pre-existing artifacts are never deleted.

Error text is normalized to a bounded, secret-free diagnostic. The record may include an error code, stage (`input`, `provider`, `render`, `copy`, `validation`, or `cleanup`), and a short message. It must not include request headers, API keys, full provider responses, or an absolute machine path.

If a provider call times out, the example is `failed`, the timeout is recorded, and cleanup still runs. The generator must not retry indefinitely or treat a partial artifact as a pass. A rerun replaces only the corresponding example directory's generated files after validating the new run; unrelated documentation and user changes remain untouched.

## Learning Content Contract

Every input pair includes:

1. A short title and purpose.
2. A compact source scenario with named entities, relationships, and values appropriate to the type.
3. A `Requested diagram type` and `Requested render target` line matching the catalog row.
4. Two or three reading cues explaining what a learner should confirm in the output.
5. A note that the file is an input example and that the output is real-vault evidence with the recorded provider metadata.

Inputs must be deterministic and semantically equivalent across languages. They must not ask the model to emit Mermaid, SVG, Vega-Lite, TikZ, coordinates, CSS, or other renderer syntax; the production prompt profile owns that boundary. Quantitative examples must provide explicit numeric values and units. Structural examples must provide bounded nodes/edges/levels within the corresponding profile limits.

## Documentation Navigation

Add the new English and Simplified Chinese README pages to the existing VitePress navigation/sidebar using the same language-specific labels and links as the gallery. The README links to every type directory and to the manifest. No generated binary is embedded in the site navigation itself; per-example pages can reference local `result.png` files for quick visual inspection.

The existing `docs/diagram-gallery*` pages remain unchanged except for an optional cross-link to the real-vault evidence tree. Static gallery claims and real-vault evidence claims must stay visually and textually distinct.

## Determinism And Reproducibility

The following are deterministic inputs to the generator:

- catalog order and IDs;
- fixture-owned example semantics;
- selected target and compatibility mode;
- input language pair;
- export dimensions/PPI from the existing export contract;
- manifest path conventions and hash algorithm (`sha256`).

Provider-generated content can vary. The manifest therefore records provider/model and timestamps and uses status plus hashes to describe the captured run; it does not assert byte identity across independent provider calls. `check` validates the committed capture against its manifest, while a fresh `generate` run creates a new evidence set and records changed hashes explicitly.

## Testing And Acceptance

The implementation is accepted only when all of the following hold:

- catalog enumeration produces exactly 33 unique example directories;
- every directory has both input Markdown languages and a valid machine-test record;
- every passed entry has a real artifact or visual companion, valid SHA-256 hashes, and matching type/target metadata;
- no manifest path escapes `docs/diagram-examples/`;
- generated records contain no absolute Vault path or secret-shaped provider data;
- temporary Vault notes and generated artifacts are absent after the run;
- `generate --check` (or the repository's equivalent check command) detects missing files, stale hashes, duplicate IDs, and catalog drift;
- focused tests cover catalog-to-directory mapping, manifest validation, redaction, cleanup, and failure aggregation;
- the full Jest suite, build, docs build, gallery check, bundle verifier, and `git diff --check` pass;
- the generated docs are reachable from both language navigation trees.

The implementation plan must use TDD for the generator's pure functions and a guarded integration test for the real command boundary. The integration test may use a deterministic fake maintainer response in CI; the actual `E:\1Knowledge` run is recorded as release/evidence output and is not replaced by that fake.

## Rejected Alternatives

- **Flat files:** fewer directories, but type identity becomes hard to scan and collisions between artifact/input/result names are likely.
- **Renderer-family directories:** compact, but users must understand target taxonomy before finding a semantic chart type, and catalog drift is easier to hide.
- **Fixture-only copying:** deterministic and cheap, but it does not test provider configuration or the real Obsidian command path and would mislabel static output as integration evidence.
- **One combined bilingual Markdown file per type:** conflicts with the repository's sibling-file language convention and makes VitePress language routing less predictable.

