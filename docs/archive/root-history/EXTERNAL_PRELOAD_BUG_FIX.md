# External Preload Links Bug Fix

## Problem Discovered

During real-world testing with Obsidian vault, the standalone bundle failed to work when the Slidev presentation included external resources in frontmatter:

```yaml
---
background: https://source.unsplash.com/collection/94734566/1920x1080
---
```

This generated an external preload link in the HTML:

```html
<link rel="preload" as="image" href="https://source.unsplash.com/collection/94734566/1920x1080">
```

**Impact:** Breaks offline functionality - the bundle attempts to fetch external resources, defeating the purpose of a standalone bundle.

## Root Cause

The standalone bundler was removing:
- ✅ External script tags (`<script src="./assets/...">`)
- ✅ Module preload links (`<link rel="modulepreload">`)
- ✅ Local CSS stylesheet links

But **NOT removing**:
- ❌ External resource preload links (`<link rel="preload" href="https://...">`)

## Solution

Added regex pattern to remove all external preload links:

```typescript
// Remove external preload links (images, fonts, etc.) that break standalone mode
html = html.replace(/<link[^>]*\brel\s*=\s*["']preload["'][^>]*\bhref\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi, '')
```

This pattern:
- Matches `<link>` tags with `rel="preload"`
- Only removes those with external URLs (`http://` or `https://`)
- Preserves local asset preloads (if any)
- Case-insensitive (`gi` flag)

## Testing

### Test Case 1: Working Version (No External Resources)
- File: `docs/export/test-standalone-integration/test-slides.md`
- No external dependencies in frontmatter
- **Result:** ✅ Works in Firefox via file:// protocol

### Test Case 2: Broken Version (External Background)
- File: `docs/test-presentation.md`
- Contains: `background: https://source.unsplash.com/...`
- Generated HTML had external preload link
- **Result before fix:** ❌ Failed to load properly

### Test Case 3: Fixed Version
- Same file: `docs/test-presentation.md`
- Rebuilt with fix
- **Result after fix:** ✅ External preload link removed, bundle works

## Verification

Updated integration test to check for this:

```javascript
{ name: 'No external preload links', pattern: '<link[^>]*rel="preload"[^>]*href="https?://', inverse: true }
```

All automated checks now pass:
- ✅ Bundle mode marker
- ✅ Module loader (__require)
- ✅ Critical export fix
- ✅ No external scripts
- ✅ No local CSS links
- ✅ **No external preload links** ← New check
- ✅ Vue component code
- ✅ Slide content
- ✅ Inline scripts present

## Files Changed

- `slidev/packages/slidev/node/commands/standalone-bundler.ts` - Added regex to remove external preload links
- `obsidian-NotEMD/test-slidev-standalone-integration.js` - Added verification check

## Commit

```
fix(bundler): Remove external preload links in standalone bundle

External preload links (e.g., background images from URLs) break the
standalone bundle's offline capability. These links create external
dependencies that prevent the bundle from working under file:// protocol.

This fix removes all <link rel="preload"> tags that reference external
URLs (http:// or https://), ensuring the bundle remains truly standalone.
```

## Real-World Impact

This bug would affect any Slidev presentation using:
- External background images (`background: https://...`)
- External fonts preloaded via frontmatter
- Any other external resource preloads

The fix ensures true offline capability for all standalone bundles.
