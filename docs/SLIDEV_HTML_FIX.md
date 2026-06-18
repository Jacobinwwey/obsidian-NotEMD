# Slidev HTML Export Verification Notes

This document describes the current HTML export behavior for NoteMD's Slidev workflow.

## Current Truth

HTML export has two supported modes:

1. `standalone` - builds `index-standalone.html` with Slidev's standalone bundle support. This is the preferred maintainer-inspection path.
2. `server-script` - builds a normal Slidev SPA and generates local server helper scripts. This remains the compatibility path for browsers that need HTTP serving.

The current maintainer smoke test uses `standalone` mode by default:

```bash
npm run verify:slidev-export
```

## What The Verification Covers

The maintainer command verifies more than a raw Slidev build:

1. NoteMD prepares a Slidev source deck from `docs/architecture.zh-CN.md`.
2. The full Slidev skill directory is discovered, including reference files.
3. The local Slidev fork is selected when available.
4. The HTML output directory is recreated before build.
5. The generated deck does not contain stale text from previous outputs.
6. The generated deck does not select an uninstalled theme.
7. Playwright opens representative slides from the final standalone HTML.
8. Generated inspection artifacts are not hidden by `.gitignore`.

## Manual Verification

Run:

```bash
npm run verify:slidev-export
```

Expected key report fields:

```json
{
  "ok": true,
  "slideSource": {
    "skillReferenceCount": 52
  },
  "ignoredOutputs": []
}
```

The exact reference count may change when the local Slidev skill changes. It should not drop to zero when the skill directory is present.

## Server-Script Compatibility Path

When testing server-script mode:

```bash
npm run verify:slidev-export -- --html-mode server-script --no-playwright
```

Expected output files include:

```text
index.html
assets/
start-server.sh
start-server.bat
README.md
```

Serve the generated directory with the generated script when manually testing browser behavior.

## Security Notes

Standalone mode does not require a local HTTP server.

Server-script mode still keeps server execution explicit and user-controlled:

1. the plugin does not keep a persistent server running;
2. generated scripts serve localhost only;
3. the user starts and stops the server manually;
4. the exported files remain usable without Obsidian running.

## Output Policy

The generated files under `docs/export/` are local verification artifacts. Keep them available for inspection while testing, but do not commit them unless the task explicitly requires generated output.
