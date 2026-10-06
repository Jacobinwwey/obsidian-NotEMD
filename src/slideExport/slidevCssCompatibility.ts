/**
 * UnoCSS directives clean up empty rules using a whole-string MagicString update.
 * MagicString 1.4.3 retains previously inserted chunks during that update, emitting
 * duplicate bare declarations. Normalize only Slidev's own empty style rules
 * before directives run; retain strict CSS minification and all effective styles.
 */
export const SLIDEV_CSS_COMPATIBILITY_CONFIG = `// Notemd managed Slidev CSS compatibility
import postcss from 'postcss';
export default {
  plugins: [{
    name: 'notemd-slidev-empty-css-rules',
    enforce: 'pre',
    transform: {
      order: 'pre',
      handler(code, id) {
        const filename = id.replace(/\\\\/g, '/').split('?')[0];
        if (!filename.includes('/@slidev/client/styles/') || !filename.endsWith('.css')) return;
        const root = postcss.parse(code, { from: filename });
        let changed = false;
        root.walkRules(rule => {
          if (rule.nodes.length === 0) {
            rule.remove();
            changed = true;
          }
        });
        if (!changed) return;
        const output = root.toResult({ to: filename, map: { inline: false, annotation: false } });
        return { code: output.css, map: output.map.toJSON() };
      },
    },
  }],
};
`;
