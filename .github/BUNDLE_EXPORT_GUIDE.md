# Slidev Bundle Export Guide

Complete guide for contributors and users working with Slidev presentation exports.

## Overview

NotEMD supports exporting Slidev presentations in two modes:
1. **Standalone Mode** (default) - Single HTML file, double-click to view
2. **Server-Script Mode** - Multi-file with local server scripts

## Quick Start

### For End Users

**Export a presentation:**
1. Open markdown file with Slidev frontmatter in Obsidian
2. Run command: "Export Slides"
3. Choose format: "HTML"
4. Output appears in `vault/export/[presentation-name]-slides/`

**View standalone export:**
- Double-click `index-standalone.html`
- Opens directly in browser, no setup needed

**View server-script export:**
```bash
cd vault/export/[presentation-name]-slides/
./start-server.sh    # macOS/Linux
start-server.bat     # Windows
# Open http://localhost:8765
```

### For Developers

**Regenerate standalone bundle:**
```bash
cd ~/obsidian-NotEMD
node test-bundle-FIXED.js
# Output: docs/dist/index-standalone.html
```

**Test the bundle:**
```bash
cd docs/dist
python3 -m http.server 8888 &
node /tmp/final-verify.js
```

## Architecture

### Standalone Mode

**Transformation Pipeline:**
```
Slidev Source (.md)
  ↓ [Slidev CLI]
Vite Build Output (index.html + assets/)
  ↓ [test-bundle-FIXED.js]
ES Module Collection (34 files)
  ↓ [transformToCommonJS]
CommonJS Modules (transformed)
  ↓ [JSON.stringify + inline]
Single HTML Bundle (727KB)
```

**Key Transformations:**

1. **Imports:** `import('./module.js')` → `Promise.resolve(__require('./module.js'))`
2. **Meta URL:** `import.meta.url` → `"file:///./assets/module.js"`
3. **Exports:** `export {X as default}` → `module.exports.default=module.exports=X`
4. **CSS:** All stylesheets inlined into `<style>` tags
5. **Module Loader:** Custom `__require()` function with caching

### Server-Script Mode

**Output Structure:**
```
export/presentation-slides/
├── index.html              # Entry point (1.6KB)
├── assets/                 # ES modules (~700KB)
│   ├── index-*.js
│   ├── modules/
│   └── slidev/
├── start-server.sh         # Unix launcher
├── start-server.bat        # Windows launcher
└── README.md               # User instructions
```

## Code Structure

### Repository Files

```
obsidian-NotEMD/
├── test-bundle-FIXED.js                    ⭐ Production bundler
├── test-bundle-from-dist.js                (legacy - has bug)
├── test-*.js                               (development/testing)
│
├── src/
│   └── slideExport/
│       ├── singleFileBundler.ts            Plugin integration
│       ├── slidevExporter.ts               Mode routing
│       ├── serverScripts.ts                Server script generator
│       └── types.ts                        Type definitions
│
├── docs/
│   ├── STANDALONE_BUNDLE_FIX.md            ⭐ Latest bug fix docs
│   ├── SINGLE_FILE_BUNDLER.md              Architecture overview
│   ├── SLIDEV_SOLUTION.md                  Server-script mode
│   ├── SLIDEV_HTML_FIX.md                  Problem analysis
│   │
│   ├── dist/                               Build output
│   │   ├── README.md                       Output docs
│   │   ├── index-standalone.html           ⭐ Production bundle
│   │   └── index.html                      Multi-file build
│   │
│   └── export/                             User exports
│       └── README.md                       User guide
│
├── BUNDLE_SCRIPTS_README.md                Script reference
├── CHANGELOG_STANDALONE_BUNDLE.md          Version history
└── .github/
    └── BUNDLE_EXPORT_GUIDE.md              This file
```

### Key Functions

**`test-bundle-FIXED.js`:**
- `loadModulesRecursive()` - Recursively loads all .js files
- `transformToCommonJS()` - Transforms ES modules to CommonJS
- `createStandaloneBundle()` - Main bundler logic
- `inlineCSS()` - Inlines CSS from module references

**Export transformation (line 90-105):**
```javascript
code = code.replace(/export\s*\{([^}]+)\}\s*;?/g,
  (m, exports) => exports.split(',').map(e => {
    const parts = e.trim().split(/\s+as\s+/);
    if (parts.length === 2) {
      const exportName = parts[1].trim();
      const localName = parts[0].trim();
      if (exportName === 'default') {
        return `module.exports.default=module.exports=${localName};`;
      }
      return `module.exports.${exportName}=${localName};`;
    }
    return `module.exports.${parts[0].trim()}=${parts[0].trim()};`;
  }).join(''));
```

## Bug Fix History

### Critical Bug (Fixed 2026-06-16)

**Problem:** Empty slides showing `<!---->`

**Root Cause:**
```javascript
// Original transformation (WRONG)
export {S as default};
  ↓
module.exports.default = S;

// Vue's defineAsyncComponent expects:
const component = require('./module.js');
// component = { default: S }
// But Vue also checks: component.default || component
// Only works if: module.exports = S (in addition to .default)
```

**Solution:**
```javascript
// Fixed transformation (CORRECT)
export {S as default};
  ↓
module.exports.default = module.exports = S;

// Now both work:
// 1. component.default → S
// 2. component → S (CommonJS default)
```

**Files Changed:**
- `test-bundle-FIXED.js` (lines 90-105)

**Verification:**
- ✅ All slides render correctly
- ✅ "Introduction to Machine Learning" visible
- ✅ No more empty comment nodes
- ✅ Works in all browsers

## Testing

### Manual Testing

**1. Generate Bundle:**
```bash
node test-bundle-FIXED.js
```

**2. Visual Test:**
```bash
# Start server
cd docs/dist
python3 -m http.server 8888 &

# Open in browser
open http://localhost:8888/index-standalone.html
```

**3. Check Content:**
- Verify heading: "Introduction to Machine Learning"
- Verify subtitle: "Understanding AI's Most Powerful Subset"
- Verify navigation: "Press Space for next page"
- Test slide navigation (space bar, arrows)
- Test animations/v-clicks

**4. Check Console:**
- Open DevTools (F12)
- Look for errors (should be none)
- Check network tab (no failed requests)

### Automated Testing

**Verification Script:**
```bash
cd docs/dist
python3 -m http.server 8888 &
node /tmp/final-verify.js
```

**Expected Output:**
```
=== RESULT ===
Status: ✅ SUCCESS
Slide exists: true
Has content: true
Xt exists: true

Text preview:
Introduction to Machine LearningUnderstanding AI's Most Powerful Subset Press Space for next page
```

### Cross-Browser Testing

Test in all major browsers:
```bash
# Chrome
google-chrome http://localhost:8888/index-standalone.html

# Firefox
firefox http://localhost:8888/index-standalone.html

# Edge
microsoft-edge http://localhost:8888/index-standalone.html
```

Also test double-click (file:// protocol):
```bash
open docs/dist/index-standalone.html
```

## Troubleshooting

### Build Issues

**Empty slides:**
- Old bug, fixed in test-bundle-FIXED.js
- Regenerate: `node test-bundle-FIXED.js`

**File size wrong:**
- Expected: ~727KB
- Check: `ls -lh docs/dist/index-standalone.html`
- If too small: Build failed, check logs
- If too large: Extra content or duplication

**Module not found:**
- Check BASE_DIR in script: `const BASE_DIR = 'docs/dist';`
- Verify dist directory exists: `ls docs/dist/`
- Rebuild Slidev: `cd docs && npm run build`

### Runtime Issues

**Blank page:**
- Check browser console (F12)
- Look for JavaScript errors
- Verify file protocol is allowed (or use HTTP)

**CORS errors:**
- Standalone should NOT have CORS issues
- If seeing CORS: Using wrong file (index.html not index-standalone.html)

**Console errors:**
- Module loading errors → Check transformations
- Vue component errors → Check export handling
- CSS errors → Check inline CSS

## Contributing

### Making Changes

**1. Modify bundler:**
```bash
# Edit transformation logic
vim test-bundle-FIXED.js

# Test changes
node test-bundle-FIXED.js
```

**2. Verify output:**
```bash
# Check file size
ls -lh docs/dist/index-standalone.html

# Run verification
cd docs/dist && python3 -m http.server 8888 &
node /tmp/final-verify.js
```

**3. Test in browsers:**
- Chrome, Firefox, Edge
- Both file:// and http://
- Check console for errors

**4. Update documentation:**
- Update relevant docs in `docs/`
- Add entry to `CHANGELOG_STANDALONE_BUNDLE.md`
- Update this guide if workflow changes

### Code Review Checklist

Before submitting PR:
- [ ] Bundle generates successfully
- [ ] File size is reasonable (~727KB ±10%)
- [ ] Verification script passes
- [ ] Visual content displays correctly
- [ ] No console errors
- [ ] Works in Chrome, Firefox, Edge
- [ ] Works under file:// protocol
- [ ] Documentation updated
- [ ] Changelog entry added
- [ ] Tests pass

## Deployment

### Release Checklist

Before releasing new version:
1. Run full test suite
2. Verify in all browsers
3. Update version numbers
4. Update changelog
5. Tag release
6. Build plugin with new bundler
7. Test end-to-end in Obsidian

### Version Numbering

Standalone bundle versions:
- **Major (X.0.0):** Architecture changes
- **Minor (1.X.0):** New features
- **Patch (1.0.X):** Bug fixes

Current version: **1.0.1** (bug fix release)

## Resources

### Documentation
- [STANDALONE_BUNDLE_FIX.md](../docs/STANDALONE_BUNDLE_FIX.md) - Bug fix details
- [SINGLE_FILE_BUNDLER.md](../docs/SINGLE_FILE_BUNDLER.md) - Architecture
- [BUNDLE_SCRIPTS_README.md](../BUNDLE_SCRIPTS_README.md) - Script reference
- [CHANGELOG_STANDALONE_BUNDLE.md](../CHANGELOG_STANDALONE_BUNDLE.md) - Version history

### Code References
- `test-bundle-FIXED.js` - Production bundler (lines 90-105 for export fix)
- `src/slideExport/singleFileBundler.ts` - Plugin integration
- `src/slideExport/slidevExporter.ts` - Mode routing

### External Resources
- [Slidev Documentation](https://sli.dev/)
- [Vue 3 Guide](https://vuejs.org/guide/)
- [Vite Documentation](https://vitejs.dev/)
- [CommonJS Specification](https://nodejs.org/api/modules.html)

## Support

### Getting Help

**For Users:**
- Check `docs/export/README.md` in export directory
- Review troubleshooting section above
- Open issue on GitHub

**For Developers:**
- Read architecture docs
- Review code comments
- Check test scripts
- Contact maintainers

### Reporting Issues

Include:
1. Bundle version
2. Browser and version
3. Operating system
4. Error messages (console output)
5. Steps to reproduce
6. Expected vs actual behavior

---

**Maintained by:** NotEMD Development Team  
**Repository:** https://github.com/Jacobinwwey/obsidian-NotEMD  
**Last Updated:** 2026-06-16  
**Bundle Version:** 1.0.1 (Standalone)
