# Architecture and code audit — 2026-10-04

Scope: main at d99309780679 plus the 1.9.10 candidate. This is a source and consumer-boundary audit, using ponytail-audit's delete / native / reuse / shrink / yagni categories alongside separate correctness and security review. The community page produced 646 scanner findings in 108 rule/message groups; those counts are not confirmed bug counts. Evidence is classified below.

## Architecture and ownership

Commands and sidebar actions enter NotemdPlugin, then operation contracts/host adapters. Diagram generation plans a semantic type, calls the shared provider transport, parses and validates DiagramSpec, and selects a renderer. Target descriptors own file mechanics; capability projections join types, targets and export formats. Preview/export adapters consume artifacts. The Vault delivery boundary owns filenames, collision avoidance, receipts and recoverable history. Slidev presentation export remains a separate desktop subsystem with different runtime dependencies.

The main entrypoint and settings tab are large composition roots. Their size alone is not justification for a new facade. Confirmed defects cluster around external boundaries: imported SVG obtains DOM authority, local secrets have incorrect storage ownership, and desktop-only dependencies enter a mobile bundle before feature guards run. Moving methods into more classes without correcting these contracts would preserve the defects.

## Confirmed defects and repairs

| Priority | Root cause | Repair and evidence |
|---|---|---|
| P1 | Vault SVG companion passes through previewSvg to host innerHTML; export adaptation did not remove event attributes or confine CSS. | Browser SVG boundary uses DOMPurify and a static SVG CSS property allowlist. Host mounts use ownerDocument. Active embeds, external resources and event attributes are removed; vector text, internal references, gradients and markers survive. |
| P1 | LocalServer's static fs/path imports execute while loading the mobile plugin, despite isDesktopOnly=false. | Node modules are lazy inside desktop operations; final production bundle is loaded in an actual browser with Node imports rejected. |
| P1 | Device-wide localStorage provider key leaks configurations across Vaults; failed local writes were swallowed before secrets were omitted from data.json. | App-scoped storage isolates Vaults and rejects write failures. Explicit legacy import preserves the old global record and existing configured providers; it can replace unused defaults. No automatic copying across Vaults. |
| P1 | Server binds all interfaces and grants wildcard CORS. | Loopback-only bind, exact Host/Origin policy, GET/HEAD, decoded/realpath containment, UTF-8 content types and nosniff. |
| P2 | Port probe and real bind are separate; pending startup is invisible to shutdown; shared consumers can close each other's listener. | Register pending work before await, retry actual bind, canonical directory key, paired acquisition/release counts, unload cancels every entry. Actual listener tests cover overlap and shutdown. |
| P2 | Local-only toggle is placed in the missing-provider branch. | Toggle is shown only for the valid selected provider. |
| P2 | Native favorites event rejects without handling; copy reports success before its Promise resolves. | Favorites restore state and display failure; clipboard awaits completion and explicitly rejects unavailable access. |
| P2 | Explicit user deletion hardcodes the system trash option. | FileManager.trashFile delegates to the Vault's deletion preference. Automatic generated-chapter cleanup remains a separate ownership decision. |

Three regressions in the new SVG boundary were caught before release: multi-panel CSS lost its scope during composition, attacker-chosen scope IDs could affect another graphic, and repeated export compounded scoped CSS selectors. Compose raw panel markup, then scope each nested SVG; every receiving boundary issues fresh scope IDs and rebinds prior scoped selectors. Browser tests verify actual computed colors and isolation, rather than merely searching output strings. Validated source CSS rules are stored separately from the receiving scope; both the visible stylesheet and source-rule metadata are revalidated at the boundary, keeping reopen/export cycles stable. Forged metadata cannot acquire host or network authority. Legacy foreignObject Chinese text is converted to vectors before active HTML is stripped.

## Ponytail decisions

- **native:** replace builtin-modules with node:module.builtinModules, including node: specifiers. The platform owns this list; shipping another package duplicated it.
- **delete:** remove unused direct lodash and @types/lodash dependencies after checking src/scripts/.github. Transitive dependencies still use lodash; this is not a claim that the entire dependency tree is vulnerability-free.
- **reuse:** desktop detection uses the existing platformUtils boundary. SVG host mounting has one authority boundary instead of separate partial sanitizers at each UI caller.
- **shrink:** remove the temporary port-probe server. The real server owns binding and collision retry.
- **retain:** type catalog, target descriptor, capability projection and operation contracts answer different questions. Keep them while verifying their joins; flattening them into one giant catalog would mix semantic planning, artifact mechanics and UI policy.
- **retain:** delivery receipts and recovery manifests preserve partial successes and frozen export settings. Their complexity has a demonstrated user-facing purpose; do not replace them with a generic successful/failed flag.
- **yagni:** do not introduce a new event bus, universal export service, settings facade or global migration framework for these local corrections.

## Remaining risks and rejected claims

1. Mermaid iframe currently needs allow-scripts plus allow-same-origin and accesses a parent bridge. It is not a strong isolation boundary. This candidate locks Mermaid's security configuration and routes both parent-bridge render methods through the shared safe SVG return boundary; a future opaque-origin message bridge requires a coordinated contract change, viewport parity and a release packaging gate. Removing same-origin alone would break rendering.
2. Browser SVG sanitation does not turn pure Node/offline raw SVG into universally safe markup. Any later DOM consumer must sanitize. This is documented explicitly.
3. Native Obsidian 1.13 settings discovery is a forward compatibility gap: the available SDK/1Knowledge host is 1.12.7 and has no verified new contract. Build one projection from the existing catalog when the API is verified; do not duplicate searchable labels by hand.
4. Fixed-source new Function import shims are CSP/design debt, not evidence that note text is concatenated into executable JavaScript. Playwright page.evaluate DOM constructors execute in their own realm; those instanceof findings are not Obsidian popout bugs.
5. The shared global link regex suspicion is unconfirmed: replace may reset lastIndex. Do not label it a reproduced deletion bug without a runtime counterexample.
6. Filesystem replacement between realpath/stat/read remains a same-machine race requiring write access. No remote containment bypass was confirmed. Server HTML is an intentionally executable presentation; it must remain on loopback.
7. Settings writes span two stores and are not an atomic transaction. Local-write rejection prevents silent credential loss; concurrent transactional persistence is separate work requiring a measured failing ordering case and clear rollback ownership.
8. Root Mermaid upgrades to 11.17.2 with a locked dependency update. Export-toolchain advisories remain and must be reviewed per execution exposure; no forced major dependency upgrade or blanket vulnerability-free claim.
9. Single main.js includes heavy rendering dependencies. Existing render-host audit proves self-contained packaging, not separate-runtime isolation. Any future split must ship, audit and version its runtime asset together.
10. Native Drawnix rearrangement fidelity and detached static arrows still require native consumer evidence. Routing correctness and retained relation metadata do not prove editor attachment semantics.

## Rollout

Ship security/ownership fixes first without restructuring working diagram generation. Preserve legacy provider storage and offer deliberate per-Vault import. Retain requested PNGs, compatibility companions, independent format choices, no fixed relation quota and separate presentation settings. Gate with fresh build, full Jest, lint ratchet, UI/render-host audits, live 1Knowledge CLI checks, bilingual docs and all published locale pages. Push main, verify Linux/Windows CI, publish one numeric 1.9.10 tag through the checked publisher, verify the four immutable assets, then explicitly deploy Pages after the public Release and chronicle update. See the bilingual implementation plan and acceptance record for current execution evidence.
