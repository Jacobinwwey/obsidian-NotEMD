# Bundler Scripts Reference

This document explains all bundler and test scripts in the repository root.

## Production Script

### `test-bundle-FIXED.js` ⭐
**Status:** Production-ready, bug-fixed (2026-06-16)

**Purpose:** Generates standalone HTML bundles from Slidev presentations

**Usage:**
```bash
node test-bundle-FIXED.js
```

**Output:**
- `docs/dist/index-standalone.html` - Single-file bundle (727KB)
- All JavaScript and CSS inlined
- Works under `file://` protocol (double-click to view)

**Key Features:**
- Transforms ES modules → CommonJS
- Custom module loader system
- Fixed export transformation (handles `export {X as default}`)
- Inlines all assets
- No external dependencies

**Integration:**
- Called by `src/slideExport/singleFileBundler.ts` in plugin
- Generates standalone mode exports
- Default export mode in plugin settings

## Legacy/Development Scripts

### `test-bundle-from-dist.js`
**Status:** Superseded by `test-bundle-FIXED.js`

**Purpose:** Earlier version of bundler (before export fix)

**Note:** Contains the original bug where `export {X as default}` only generated `module.exports.default=X` without dual assignment. Keep for reference/debugging.

### `test-bundler-quick.js`
**Status:** Development/testing

**Purpose:** Quick bundler test with minimal output

**Usage:**
```bash
node test-bundler-quick.js
```

### `test-inline-bundler.js`
**Status:** Development/testing

**Purpose:** Tests inline CSS/JS bundling logic

### `test-inline-poc.js`
**Status:** Proof-of-concept (archived)

**Purpose:** Original POC demonstrating inline bundling feasibility

**Historical value:** First working prototype showing single-file bundle is possible

### `bundle-single-file.js`
**Status:** Development

**Purpose:** Alternative bundler implementation (experimental)

### `bundle-single-file-clean.js`
**Status:** Development

**Purpose:** Cleaned-up version of alternative bundler

### `test-standalone-e2e.js`
**Status:** Testing

**Purpose:** End-to-end test for standalone bundles

**Usage:**
```bash
node test-standalone-e2e.js
```

## Verification Scripts

Scripts in `/tmp/` directory (created during debugging):

### `/tmp/final-verify.js`
**Purpose:** Puppeteer-based verification of bundle functionality

**Usage:**
```bash
cd docs/dist && python3 -m http.server 8888 &
node /tmp/final-verify.js
```

**Checks:**
- Slide elements exist
- Content renders (not empty `<!---->`)
- Text content is visible
- No console errors

### `/tmp/comprehensive-test.js`
**Purpose:** Detailed bundle testing with console output capture

### `/tmp/check-console.js`
**Purpose:** Browser console message verification

## Directory Structure

```
obsidian-NotEMD/
├── test-bundle-FIXED.js          ⭐ PRODUCTION (use this)
├── test-bundle-from-dist.js      (legacy - has bug)
├── test-bundler-quick.js         (dev/test)
├── test-inline-bundler.js        (dev/test)
├── test-inline-poc.js            (POC archive)
├── bundle-single-file.js         (experimental)
├── bundle-single-file-clean.js   (experimental)
├── test-standalone-e2e.js        (testing)
│
├── docs/
│   ├── dist/
│   │   └── index-standalone.html (output)
│   │
│   ├── STANDALONE_BUNDLE_FIX.md  (latest docs)
│   ├── SINGLE_FILE_BUNDLER.md    (architecture)
│   ├── SLIDEV_SOLUTION.md        (server-script mode)
│   └── SLIDEV_HTML_FIX.md        (problem analysis)
│
└── /tmp/
    ├── final-verify.js           (verification)
    ├── comprehensive-test.js     (testing)
    └── check-console.js          (testing)
```

## Quick Reference

| Task | Script | Output |
|------|--------|--------|
| Generate standalone bundle | `node test-bundle-FIXED.js` | `docs/dist/index-standalone.html` |
| Verify bundle works | `node /tmp/final-verify.js` | Screenshot + status |
| Quick test | `node test-bundler-quick.js` | Console output |
| E2E test | `node test-standalone-e2e.js` | Full test report |

## Bug Fix Timeline

**Before (2026-06-15):**
- Used `test-bundle-from-dist.js`
- Bug: `export {S as default}` → `module.exports.default=S` only
- Result: Empty slides showing `<!---->`

**After (2026-06-16):**
- Fixed in `test-bundle-FIXED.js`
- Correct: `export {S as default}` → `module.exports.default=module.exports=S`
- Result: All slides render correctly ✅

## Maintenance Notes

### When to Update

Update bundler scripts when:
1. Slidev version changes (new features/APIs)
2. Vue version changes (component format)
3. Vite/Rolldown output format changes
4. New module patterns need support

### Testing Checklist

Before committing bundler changes:
- [ ] Run `node test-bundle-FIXED.js`
- [ ] Verify output size (~700KB range)
- [ ] Run `node /tmp/final-verify.js`
- [ ] Check "Introduction to Machine Learning" is visible
- [ ] No console errors
- [ ] Test in Chrome, Firefox, Edge
- [ ] Test under `file://` protocol
- [ ] Update documentation

### Integration Points

Plugin integration:
- `src/slideExport/singleFileBundler.ts` - Calls bundler logic
- `src/slideExport/slidevExporter.ts` - Routes to standalone/server-script
- `src/types.ts` - `slideExportHtmlMode` setting
- `src/ui/NotemdSettingTab.ts` - UI controls

## See Also

- [docs/STANDALONE_BUNDLE_FIX.md](docs/STANDALONE_BUNDLE_FIX.md) - Detailed fix documentation
- [docs/SINGLE_FILE_BUNDLER.md](docs/SINGLE_FILE_BUNDLER.md) - Architecture overview
- [src/slideExport/README.md](src/slideExport/README.md) - Plugin integration (if exists)

---

**Last Updated:** 2026-06-16  
**Current Production Script:** `test-bundle-FIXED.js`
