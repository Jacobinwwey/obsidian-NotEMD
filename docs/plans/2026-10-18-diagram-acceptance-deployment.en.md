# Diagram acceptance gallery and Vault deployment

[中文](./2026-10-18-diagram-acceptance-deployment.zh-CN.md)

## Scope and design

Continue the completed ER and five cross-family repairs, without relabeling the remaining 33-type roadmap as implemented. Produce an offline acceptance folder with paired genuine PNG exports, original SVG/source JSON, explicit baseline provenance, and a selectable, keyboard-accessible bilingual HTML comparison. Use the Git HEAD source as the before baseline, not a fabricated degraded image. The semantic-upgrade case explicitly records the old legacy projection and new typed payload from equivalent source facts; all other pairs use identical inputs. Recoverable cyclic/forest topology and missing declared-coordinate steps remain exportable diagrams with visible source caveats; no diagnostic-only substitute or invented business content. Structural/security boundary validation remains in place.

An HTML-only mock would not prove export quality; bulk overwriting existing examples would destroy provenance. A reproducible generator and fresh timestamped folders provide the smallest complete solution. User has authorized inline execution and deployment to 1Knowledge; no additional approval checkpoint is needed.

## Phases

- [x] 1. Add red tests for offline page safety, provenance and keyboard/responsive comparison behavior.
- [x] 2. Implement paired baseline/current exports and generate the acceptance folder with measured outcomes and checksums.
- [x] 3. Inspect desktop/mobile screenshots and test links, native-resolution viewing and exported images.
- [x] 4. Build and run targeted/full regressions, preserving and reporting unrelated release-fixture failures rather than weakening their assertions.
- [x] 5. Back up the installed plugin on E:, preserve settings hashes, copy the validated bundle and acceptance folder into 1Knowledge, reload via official CLI and verify the live runtime.

No commit, release, provider call, dependency upgrade, original-note overwrite or .trellis cleanup. Deployment backup lives outside the plugin directory; no credentials/settings content enters the acceptance gallery.
