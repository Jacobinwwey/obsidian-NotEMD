#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const websiteRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(websiteRoot, 'docs', 'features', 'diagrams.mdx');
const i18nRoot = path.join(websiteRoot, 'i18n');
const endpoint = process.env.LM_STUDIO_ENDPOINT || 'http://100.80.17.113:301/v1/chat/completions';
const model = process.env.LM_STUDIO_MODEL || 'hy-mt2-7b';

function parseArguments(argv) {
  const options = {locales: [], write: false, normalizeExisting: false};
  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--write') {
      options.write = true;
      continue;
    }
    if (argument === '--normalize-existing') {
      options.normalizeExisting = true;
      continue;
    }
    if (argument === '--locales') {
      index += 1;
      options.locales = (argv[index] || '').split(',').map((locale) => locale.trim()).filter(Boolean);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.locales.length === 0) {
    throw new Error('--locales requires one or more comma-separated locale codes');
  }
  if (!options.normalizeExisting && options.locales.length > 8) {
    throw new Error('Process at most 8 locales per run to stay within the 32k model context budget');
  }
  return options;
}

function normalizeMdx(content) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd() + '\n';
}

function stripModelFence(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:mdx|markdown)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function headingShape(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.match(/^#+/)[0].length);
}

function splitMdxDocument(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)\s*import TLDR from '@site\/src\/components\/TLDR';\s*\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Unable to split MDX frontmatter, import, and body');
  }
  return {frontmatter: match[1], body: match[2].trim()};
}

function validateTranslation(source, translated, locale) {
  if (!translated.startsWith('---\n') || !translated.includes("import TLDR from '@site/src/components/TLDR';")) {
    throw new Error(`${locale}: frontmatter or TLDR import was not preserved`);
  }
  if (JSON.stringify(headingShape(translated)) !== JSON.stringify(headingShape(source))) {
    throw new Error(`${locale}: heading levels do not mirror the English guide`);
  }
  for (const token of ['Notemd', 'Obsidian', 'Mermaid', 'JSON Canvas', 'Draw.io', 'Drawnix', 'CircuitikZ', 'TikZJax', 'SVG', 'PNG', 'PDF', '.canvas', '.drawio', '.drawnix', '.tex']) {
    if (!translated.includes(token)) {
      throw new Error(`${locale}: missing preserved token ${token}`);
    }
  }
  if (/preferredDiagramRenderTarget|cmos-inverter-v1|--compile-executable|Golden Reference Prompt Shape/.test(translated)) {
    throw new Error(`${locale}: maintainer-only content leaked into the user guide`);
  }
}

async function translateGuide(sourceBody, locale) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 12000,
      messages: [
        {
          role: 'system',
          content: [
            'You are a documentation localization engineer.',
            'Translate the complete MDX user guide into the requested locale.',
            'Return only the complete translated MDX document without a code fence or explanation.',
            'Preserve frontmatter keys, MDX imports, Markdown structure, heading levels, tables, list numbering, links, inline code, file extensions, and product names.',
            'Do not translate: Notemd, Obsidian, Mermaid, JSON Canvas, Draw.io, Drawnix, CircuitikZ, TikZJax, SVG, PNG, PDF, TLDR.',
            'The input starts at the H1 heading. Translate headings, prose, table descriptions, steps, and troubleshooting text.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `Target locale: ${locale}\n\n${sourceBody}`,
        },
      ],
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${locale}: LM Studio returned HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
  const payload = JSON.parse(body);
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${locale}: LM Studio returned no translated document`);
  }
  return stripModelFence(content).replace(/\r\n/g, '\n').trim();
}

async function main() {
  const options = parseArguments(process.argv);
  const source = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
  const sourceParts = splitMdxDocument(source);

  for (const locale of options.locales) {
    process.stdout.write(`[${locale}] translating... `);
    const targetPath = path.join(
      i18nRoot,
      locale,
      'docusaurus-plugin-content-docs',
      'current',
      'features',
      'diagrams.mdx'
    );
    if (!fs.existsSync(targetPath)) {
      throw new Error(`${locale}: expected localized source does not exist: ${targetPath}`);
    }
    if (options.normalizeExisting) {
      const normalized = normalizeMdx(fs.readFileSync(targetPath, 'utf8'));
      validateTranslation(source, normalized, locale);
      if (options.write) {
        fs.writeFileSync(targetPath, normalized, 'utf8');
        process.stdout.write('normalized and written\n');
      } else {
        process.stdout.write('normalized (dry run)\n');
      }
      continue;
    }

    const localizedParts = splitMdxDocument(fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n'));
    const translatedBody = await translateGuide(sourceParts.body, locale);
    const translated = normalizeMdx(`${localizedParts.frontmatter}\nimport TLDR from '@site/src/components/TLDR';\n\n${translatedBody}\n`);
    validateTranslation(source, translated, locale);
    if (options.write) {
      fs.writeFileSync(targetPath, translated, 'utf8');
      process.stdout.write('validated and written\n');
    } else {
      process.stdout.write('validated (dry run)\n');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
