# Implementation plan — 1.9.10

## Scope and constraints

Continue from d99309780679 without repeating completed PNG work. CLI only; preserve 1Knowledge notes and existing outputs. Author translations directly, never call a translation API or LM Studio. Keep presentation and diagram exports separate. Unsupported choices remain visible after supported ones. No fixed relation quota. Publish immutable main.js, manifest.json, styles.css and README.md with complete English/Chinese notes.

## Phases

1. Reconcile inherited edits and reproduce community findings at real boundaries. Complete SVG, mobile loading, local storage, settings events, deletion preference and loopback server corrections.
2. Review ponytail proposals; delete unused direct dependencies, use the Node builtin list, upgrade patched Mermaid, preserve justified catalogs and recovery contracts. Document unresolved isolation/transactional risks.
3. Run targeted and full regression, build, lint ratchet and audits. Load the current plugin through CLI into 1Knowledge; test normal preview/export paths without changing user source files. Restore settings after probes.
4. Synchronize 1.9.10 metadata, bilingual audit/plan/acceptance/release notes, localized README/manual and 34 site locales. Build/audit site and navigation.
5. Commit and push main after checks. Verify Linux and Windows CI. Push numeric tag to the unique Actions publisher, verify public four-asset hashes and bilingual body, then chronicle and explicit Pages deployment.

## Acceptance

No successful UI notice for failed persistence/copy; no mobile entry Node import; no imported SVG events, host CSS leakage or external resource fetches; Chinese labels and panel styles preserved. Pending server startup is visible to unload, concurrent consumers do not interrupt one another. Vault-local credentials remain isolated; legacy import is deliberate and preserves old records. Release/Pages claims require observed remote evidence.
