const fs = require('fs');
const path = require('path');

const endpoint = 'http://100.80.17.113:301/v1/chat/completions';
const model = 'hy-mt2-7b';
const marker = '<!-- notemd-settings-discovery-guide -->';
const source = `${marker}
## Settings discovery, diagram history, and safe batch folders

The Notemd settings page provides fuzzy search, large category navigation, and per-setting favorites stored for the current Vault.

- Diagram history is stored at Vault scope, ordered newest first, searchable and paginated in groups of 20. Removing a history record does not delete generated files.
- Diagram preview export PPI controls PNG and PDF clarity. SVG remains vector-based.
- Preferred diagram type and preferred source format are separate choices.
- Advanced batch file selection enables saved selection profiles and rule previews.
- A missing batch target folder can be created after confirmation, with an option to remember automatic creation for future missing folders.
- An existing non-empty folder requires one confirmation before the whole batch, never one confirmation per generated file.
- Developer mode reveals provider diagnostics and advanced troubleshooting controls.
`;

const languageNames = {
  ar: 'Arabic', bn: 'Bengali', cs: 'Czech', da: 'Danish', de: 'German', el: 'Greek', es: 'Spanish',
  fi: 'Finnish', fr: 'French', he: 'Hebrew', hi: 'Hindi', hu: 'Hungarian', id: 'Indonesian', it: 'Italian',
  ja: 'Japanese', ko: 'Korean', ms: 'Malay', nl: 'Dutch', no: 'Norwegian', pl: 'Polish', pt: 'Portuguese',
  ro: 'Romanian', ru: 'Russian', sv: 'Swedish', th: 'Thai', tr: 'Turkish', uk: 'Ukrainian', vi: 'Vietnamese',
  zh_Hant: 'Traditional Chinese'
};

async function translate(locale) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 1800,
        messages: [
          { role: 'system', content: `Translate Markdown into ${languageNames[locale]}. Preserve the HTML marker, headings, bullets, technical names, and Markdown structure. Return only translated Markdown.` },
          { role: 'user', content: source }
        ]
      })
    });
    if (!response.ok) throw new Error(`${locale}: HTTP ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content || !content.includes(marker)) throw new Error(`${locale}: invalid translation response`);
    return `${content}\n`;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const root = path.resolve(__dirname, '..');
  for (const locale of Object.keys(languageNames)) {
    const file = path.join(root, `README_${locale}.md`);
    const current = fs.readFileSync(file, 'utf8');
    if (current.includes(marker)) continue;
    const translated = await translate(locale);
    fs.writeFileSync(file, `${current.trimEnd()}\n\n${translated}`, 'utf8');
    process.stdout.write(`${locale}\n`);
  }
}

main().catch(error => { console.error(error); process.exit(1); });
