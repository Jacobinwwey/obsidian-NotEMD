# Drawnix reserved-lane ingress repair

## Root cause and evidence

The reported `architecture.zh-CN.md` failure occurs after model generation, during Drawnix relation projection. The unresolved source image is not part of the relation router's obstacle contract. The original error log does not contain the generated specification, and a subsequent live capture attempt timed out before receiving a model response; it cannot establish a byte-identical replay of the original request.

A deterministic stress projection of the saved 250-node architecture map, with 24 synthetic routing-test relations, reproduces the same reserved-lane error. Both endpoint grid searches actually find clear paths. One ingress approaches its track horizontally along the reserved label row. Joining the bridge creates a reversal; collinear simplification removes the reserved track, sometimes removing the label-bearing span as well. The native label-position check rejects these candidates and misleadingly reports that ingress paths do not exist.

## Implementation

Treat the reserved horizontal bridge as an obstacle during endpoint ingress searches only. Its height covers both the existing route clearance and the measured label. Both the direct and grid search obey this constraint; the completed route is checked against the original node, header and other-label obstacles. The bridge remains available to the final connecting segment, with a valid native text position. Do not change node clearance, truncate relationships or substitute another output format.

Dense fallback previously rebuilt the same visibility grid for sixteen endpoint searches and sorted its whole frontier on every expansion, blocking the Obsidian main thread. Build one grid containing all candidate ports and both tracks; run two searches from the tracks to all endpoint ports, and reverse source legs before joining them. A binary min-heap retains deterministic distance/node/direction ordering with O(log n) queue operations. The source-completed 274-node/24-relation stress map exports native Drawnix and SVG in about seven seconds locally; this is an observation, not a universal timing guarantee.

Reduce the captured geometry to an anonymous 102-node regression fixture. Verify the native text center, retained track points and obstacle-free segments. Explicitly seal side ports in the vertical-port fixture, rather than requiring a particular port from an otherwise unconstrained shortest-path search. Keep a genuinely sealed-canvas regression to preserve failure behavior for impossible inputs.

## Validation and delivery

The failing regression was observed before the repair and passed afterward. The full 250-node/24-relation stress specification exports Drawnix and SVG with zero validation errors. These synthetic relationships are test evidence, not additions to the user's knowledge map. Run the production build, full Jest suite, lint ratchet and repository audits before delivery. Reload the final build through the official Obsidian CLI and replay the fixed specification at the model-response boundary in the open `1Knowledge` Vault. Preserve source files and settings; disclose the model timeout separately from routing validation. Do not replace the published 1.9.9 release assets.
