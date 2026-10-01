import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_SETTINGS } from '../constants';
import { DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL, parseCustomWorkflowButtonsDsl } from '../workflowButtons';
import { LLM_PROVIDER_DEFINITIONS } from '../llmProviders';
import { buildCliPublicSurface } from '../operations/publicCliSurface';
import { STRINGS_EN } from '../i18n/locales/en';
import { createRequire } from 'module';

const matter = createRequire(__filename)('gray-matter');

const docsRoot = path.join(__dirname, '../../website/docs');
const readGuide = (relative: string) => fs.readFileSync(path.join(docsRoot, `${relative}.mdx`), 'utf8');

describe('public guides follow executable product contracts', () => {
    test('quick start names the actual model-discovery button and concept-folder field', () => {
        const content = readGuide('getting-started/quick-start');
        expect(content).toContain(`**${STRINGS_EN.settings.providerConfig.fetchModelsButton}**`);
        expect(content).toContain(`**${STRINGS_EN.settings.generalOutput.conceptNoteFolderName}**`);
        expect(content).not.toContain('**Get Model List**');
    });

    test('concept instructions name the actual independent extraction switches', () => {
        const content = readGuide('features/concept-notes');
        expect(content).toContain(`**${STRINGS_EN.settings.extractConceptsTask.backlinkName}**`);
        expect(content).toContain(`**${STRINGS_EN.settings.extractConceptsTask.minimalName}**`);
    });

    test('research instructions identify the actual title-generation research option', () => {
        expect(readGuide('features/research')).toContain(`**${STRINGS_EN.settings.contentGeneration.enableResearchName}**`);
    });

    test('every canonical guide has parseable frontmatter', () => {
        const inspectDirectory = (directory: string): void => {
            for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
                const filename = path.join(directory, entry.name);
                if (entry.isDirectory()) inspectDirectory(filename);
                else if (entry.name.endsWith('.mdx')) {
                    expect(() => matter(fs.readFileSync(filename, 'utf8'))).not.toThrow();
                }
            }
        };
        inspectDirectory(docsRoot);
    });

    test.each(['getting-started/quick-start', 'getting-started/configuration', 'features/workflows'])('%s includes the real default workflow and executable DSL examples', relative => {
        const content = readGuide(relative);
        expect(content).toContain(DEFAULT_CUSTOM_WORKFLOW_BUTTONS_DSL);
        const examples = [...content.matchAll(/```[^\r\n]*\r?\n([\s\S]*?)```/g)]
            .map(match => match[1].trim()).filter(code => code.includes('::'));
        expect(examples.length).toBeGreaterThan(0);
        for (const example of examples) expect(parseCustomWorkflowButtonsDsl(example).errors).toEqual([]);
    });

    test.each(['getting-started/configuration', 'advanced/batch-processing', 'features/workflows', 'features/concept-notes', 'features/research', 'features/translation'])('%s documents real setting defaults', relative => {
        const content = readGuide(relative);
        const tables = [...content.matchAll(/\| Setting \| Default \|[^\n]*\r?\n\|[- |]+\|\r?\n((?:\|[^\n]*\r?\n)+)/g)];
        expect(tables.length).toBeGreaterThan(0);
        for (const table of tables) {
            for (const row of table[1].trim().split(/\r?\n/)) {
                const cells = row.split('|').map(cell => cell.trim());
                const key = cells[1].replace(/`/g, '');
                const actual = cells[2].replace(/[`'"]/g, '');
                expect(Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)).toBe(true);
                expect(actual).toBe(String(DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]));
            }
        }
    });

    test('guides do not instruct users to configure nonexistent options or invented template variables', () => {
        const paths = ['getting-started/configuration', 'features/wiki-links', 'features/workflows', 'features/research', 'features/translation', 'advanced/custom-prompts', 'advanced/batch-processing'];
        const nonexistent = ['batchOverwriteExisting', 'batchSkipProcessed', 'batchRecursive', 'workflowContinueOnError', 'workflowShowProgress', 'researchAppendToNote', 'researchLanguage', 'translateLanguage', 'translationAppendToNote', 'customConceptNoteTemplate', '{{concept}}', '{{content}}'];
        for (const relative of paths) {
            const content = readGuide(relative);
            for (const key of nonexistent) expect(content).not.toContain(key);
        }
    });

    test('the provider overview includes every registered provider', () => {
        const content = readGuide('providers/overview');
        for (const definition of LLM_PROVIDER_DEFINITIONS) {
            const row = content.split('\n').find(line => line.startsWith(`| **${definition.name}** |`));
            expect(row).toContain(`\`${definition.defaultConfig.model}\``);
            if (definition.defaultConfig.baseUrl) expect(row).toContain(`\`${definition.defaultConfig.baseUrl}\``);
        }
        expect(content).toContain('five protocol families');
    });

    test('FAQ structured answers are present in the visible document', () => {
        const parsed = matter(readGuide('faq'));
        expect(parsed.data.faqItems.length).toBeGreaterThan(0);
        for (const item of parsed.data.faqItems) {
            expect(parsed.content).toContain(`### ${item.question}`);
            expect(parsed.content).toContain(item.answer);
        }
    });

    test.each(['developers/overview', 'agents/overview', 'releases/1.9.8'])('publishes a complete %s entry point', relative => {
        expect(fs.existsSync(path.join(docsRoot, `${relative}.mdx`))).toBe(true);
        const parsed = matter(readGuide(relative));
        expect(parsed.data.title).toBeTruthy();
        expect(parsed.data.description).toBeTruthy();
        expect(parsed.content).toContain('## Next Steps');
    });

    test('the Agent guide enumerates exactly the bounded public command IDs', () => {
        expect(fs.existsSync(path.join(docsRoot, 'agents/overview.mdx'))).toBe(true);
        const content = readGuide('agents/overview');
        const ids = [...content.matchAll(/^- `(notemd:[^`]+)`$/gm)].map(match => match[1]).sort();
        expect(ids).toEqual(buildCliPublicSurface().commands.map(command => command.id).sort());
        for (const field of ['version', 'commands', 'inputSchema', 'resultSchema', 'outputHandlingTags', 'contains-provider-credentials']) expect(content).toContain(`\`${field}\``);
    });
});
