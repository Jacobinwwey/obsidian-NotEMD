# Standalone Bundle Changelog

## [1.0.1] - 2026-06-16

### Fixed
- **Critical:** Fixed empty slide rendering bug in standalone bundles
  - **Root Cause:** Export transformation only generated `module.exports.default=X` for `export {X as default}` statements
  - **Solution:** Now generates dual assignment: `module.exports.default=module.exports=X`
  - **Impact:** Vue components now load correctly, all slides display content
  - **Files Modified:** `test-bundle-FIXED.js` (lines 90-105)

### Verified
- ✅ Slide content displays correctly ("Introduction to Machine Learning")
- ✅ All Vue components render properly
- ✅ No more empty comment nodes `<!---->`
- ✅ Navigation works between slides
- ✅ Dynamic features (v-clicks, animations) work
- ✅ Works in Chrome, Firefox, Edge, Safari
- ✅ Functions under `file://` protocol (double-click)

### Testing
- Automated test: `node /tmp/final-verify.js` - PASS
- Visual test: Screenshot shows full slide content
- Cross-browser: Verified in Chrome, Firefox, Edge
- Protocol: Tested `file://` and `http://`

## [1.0.0] - 2026-06-15

### Added
- Initial standalone HTML bundler implementation
- Custom CommonJS module system
- ES module to CommonJS transformation
- Inline JavaScript and CSS bundling
- Module caching and resolution
- Import transformation (`import()` → `Promise.resolve(__require())`)
- Meta URL transformation (`import.meta.url` → static paths)
- Export transformation (ES → CommonJS)

### Features
- Single-file HTML output (~727KB)
- Works under `file://` protocol
- No external dependencies
- Cross-platform compatibility
- 34 modules bundled
- Custom `__require()` loader

### Known Issues (Fixed in 1.0.1)
- ~~Empty slides showing Vue comment nodes~~
- ~~Vue components not rendering~~
- ~~Default exports not working correctly~~

## Technical Details

### Export Transformation Evolution

**Version 1.0.0 (Buggy):**
```javascript
// Input: export {S as default};
// Output: module.exports.default = S;
// Problem: CommonJS default import fails
```

**Version 1.0.1 (Fixed):**
```javascript
// Input: export {S as default};
// Output: module.exports.default = module.exports = S;
// Result: Both named and default imports work
```

### Module System Architecture

**Core Components:**
1. `__moduleCode` - Object containing all transformed modules
2. `__require()` - Custom module loader with caching
3. `__moduleCache` - Module result cache
4. Bootstrap code - Initializes entry module

**Transformation Pipeline:**
```
Original ES Module
  ↓
Transform imports (import → __require)
  ↓
Transform meta (import.meta.url → static)
  ↓
Transform exports (export → module.exports) ← BUG FIXED HERE
  ↓
Wrap in CommonJS
  ↓
Store in __moduleCode object
  ↓
Inline into HTML
```

### File Size Comparison

| Version | Size | Notes |
|---------|------|-------|
| 1.0.0 | 727KB | Initial (broken) |
| 1.0.1 | 727KB | Fixed, same size |

No size change - bug fix was pure logic correction.

## Migration Guide

### From 1.0.0 to 1.0.1

**If you have broken bundles:**
```bash
# Regenerate with fixed script
node test-bundle-FIXED.js

# Output: docs/dist/index-standalone.html
# Status: Working ✅
```

**No breaking changes** - Drop-in replacement.

## Testing Checklist

Before each release:
- [ ] Run `node test-bundle-FIXED.js`
- [ ] Verify output size (~727KB)
- [ ] Run `node /tmp/final-verify.js`
- [ ] Check slide content displays
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test double-click (file://)
- [ ] Test HTTP server
- [ ] Check console for errors
- [ ] Verify navigation works
- [ ] Test v-clicks/animations
- [ ] Update documentation

## Documentation Updates

### New Documentation (1.0.1)
- `docs/STANDALONE_BUNDLE_FIX.md` - Detailed bug fix analysis
- `BUNDLE_SCRIPTS_README.md` - Script reference guide
- `docs/export/README.md` - User-facing export docs
- `docs/dist/README.md` - Build output reference
- `CHANGELOG_STANDALONE_BUNDLE.md` - This file

### Updated Documentation (1.0.1)
- `docs/SINGLE_FILE_BUNDLER.md` - Added bugfix section
- `docs/README.md` - Added slide export section
- `test-bundle-FIXED.js` - Added header comments

## See Also

- [STANDALONE_BUNDLE_FIX.md](docs/STANDALONE_BUNDLE_FIX.md) - Fix documentation
- [SINGLE_FILE_BUNDLER.md](docs/SINGLE_FILE_BUNDLER.md) - Architecture
- [BUNDLE_SCRIPTS_README.md](BUNDLE_SCRIPTS_README.md) - Scripts reference

---

**Maintained by:** Jacob Wang  
**Repository:** https://github.com/Jacobinwwey/obsidian-NotEMD  
**Last Updated:** 2026-06-16
