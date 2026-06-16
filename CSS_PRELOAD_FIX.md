# CSS Preload Function Fix

## Problem Discovered

After fixing the external preload links issue, standalone bundles still had runtime errors preventing slides from rendering. The browser console showed:

```
Error: Unable to preload CSS for /assets/modules/shiki-BrmBd2_v.css
Access to CSS stylesheet at 'file:///assets/modules/shiki-BrmBd2_v.css' from origin 'null' has been blocked by CORS policy
```

**Impact:** Standalone bundles loaded but displayed 0 slides due to CSS loading failures.

## Root Cause

Vite's build output includes a preload function that dynamically creates `<link>` elements to load CSS and module files. This function:

1. Creates link elements via `document.createElement('link')`
2. Sets `rel="stylesheet"` for CSS files
3. Appends them to `document.head`
4. Returns a Promise that rejects with `"Unable to preload CSS for ${file}"` on error

Under `file://` protocol, these dynamically created link elements trigger CORS errors, causing all CSS loading to fail.

### Why Previous Stubs Weren't Enough

The bundler already stubbed out:
- ✅ `__vite__mapDeps` → returns `[]`
- ✅ `__cssPreload` → returns `Promise.resolve()`
- ✅ `P` function (Vite's simple preload) → just resolves loader

But there was a **fourth function** that wasn't stubbed:
- ❌ Main preload function (variable name changes: `F`, `N`, etc.)

This function receives the dependency array from `__vite__mapDeps` and creates the link elements.

## Solution

### Challenge: Variable Name Changes

The function's variable name is minified and changes between builds:
- Build 1: `,F=function(e,t,n){...}`
- Build 2: `,N=function(e,t,n){...}`

We can't search by name.

### Approach: Content-Based Search

Search for the function by its unique error message:

```typescript
const preloadErrorMarker = 'Unable to preload CSS'
if (code.includes(preloadErrorMarker)) {
  const errorIdx = code.indexOf(preloadErrorMarker)
  // Search backwards for function definition
  const beforeError = code.substring(Math.max(0, errorIdx - 5000), errorIdx)
  const funcMatch = beforeError.match(/([,;])(\w+)=function\((\w+),(\w+),(\w+)\)\{/)
  
  if (funcMatch) {
    const varName = funcMatch[2] // Extract actual variable name (F, N, etc.)
    // Find function end and replace with stub
    code = `${before},${varName}=function(${params}){return Promise.resolve().then(${loaderParam})}${after}`
  }
}
```

### What the Stub Does

```javascript
// Original function (creates link elements)
,N=function(e,t,n){
  let r=Promise.resolve();
  if(t&&t.length>0){
    // ... creates link elements, appends to head ...
    document.createElement(`link`)
    // ... throws "Unable to preload CSS" on error ...
  }
  return r.then(()=>e()).catch(i)
}

// Replaced with stub (just calls loader)
,N=function(e,t,n){return Promise.resolve().then(e)}
```

The stub:
- Takes the same parameters: `(loader, deps, baseURL)`
- Ignores `deps` array (already empty from `__vite__mapDeps` stub)
- Just calls the loader function and resolves
- No link element creation → No CORS errors

## Additional Fixes

### CSS Import Removal

Added regex patterns to remove CSS import statements from transformed module code:

```typescript
// Remove: import './path/to/file.css'
transformed = transformed.replace(/import\s+["']\.\/[^"']+\.css["']\s*;?/g, '')

// Remove: const x = __require('./path/to/file.css')
transformed = transformed.replace(/const\s+\w+\s*=\s*__require\(['"]\.\/[^'"]+\.css['"]\)\s*;?/g, '')

// Remove: __require('./path/to/file.css')
transformed = transformed.replace(/__require\(['"]\.\/[^'"]+\.css['"]\)\s*;?/g, '')
```

### CSS Collection Moved Earlier

Moved CSS file collection to happen before module transformation to ensure all CSS files are found before code is modified.

## Testing

### Automated Verification

```bash
cd /home/jacob/obsidian-NotEMD
node test-slidev-standalone-integration.js
```

Results:
```
✅ Bundle mode marker
✅ Module loader (__require)
✅ Critical export fix
✅ No external scripts
✅ No local CSS links
✅ No external preload links
✅ Vue component code
✅ Slide content
✅ Inline scripts present
```

### Manual Testing

```bash
firefox file:///home/jacob/obsidian-NotEMD/docs/export/test-standalone-integration/dist/index-standalone.html
```

**Results:**
- ✅ Opens without errors
- ✅ No "Unable to preload CSS" errors in console
- ✅ No CORS errors
- ✅ Slides render correctly with full content
- ✅ Syntax highlighting works (CSS is inlined)
- ✅ Animations work
- ✅ Navigation works

### Test Cases

1. **Basic slides** - test-standalone-integration/test-slides.md
   - No external dependencies
   - Verifies core functionality

2. **External background** - docs/test-presentation.md
   - Contains: `background: https://source.unsplash.com/...`
   - Verifies external preload links are removed
   - Background doesn't load (expected), but bundle still works

## Files Changed

**Slidev Repository:**
- `packages/slidev/node/commands/standalone-bundler.ts`
  - Added content-based search for preload function
  - Added CSS import removal regex patterns
  - Moved CSS collection earlier in the pipeline

**Commits:**
- `4a3229c` - fix(bundler): Remove dynamic CSS/module preload function in standalone bundles
- `6f68abc` - fix(bundler): Remove external preload links in standalone bundle

## Performance Impact

None - the stub function is simpler and faster than the original.

## Browser Compatibility

Tested and working:
- ✅ Firefox (file:// protocol)
- ✅ Chrome (via Playwright automation)

## Related Issues

This fix completes the standalone bundle implementation by removing all dynamic resource loading that breaks under `file://` protocol:

1. ✅ External script tags (removed during HTML processing)
2. ✅ External preload links (removed during HTML processing)
3. ✅ CSS link tags (inlined during HTML processing)
4. ✅ Dynamic CSS loading (stubbed out in this fix)
5. ✅ Dynamic module loading (stubbed out in this fix)

## Future Improvements

If external images need to be supported:
- Download images during build
- Convert to data URLs
- Inline in HTML or CSS

This was identified as "Option 3" but not yet implemented, as it requires:
- Image downloading logic
- Format detection and conversion
- Size considerations (data URLs increase bundle size significantly)
