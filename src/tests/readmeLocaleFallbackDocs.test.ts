import * as fs from 'fs';
import * as path from 'path';

const README_VARIANTS = [
    'README.md',
    'README_ru.md',
    'README_de.md',
    'README_es.md',
    'README_fr.md',
    'README_it.md',
    'README_pt.md',
    'README_ja.md',
    'README_ko.md',
    'README_zh.md',
    'README_zh_Hant.md'
] as const;

describe('readme locale fallback docs', () => {
    test.each(README_VARIANTS)('%s documents regional uiLocale fallback examples', (fileName) => {
        const readme = fs.readFileSync(path.join(__dirname, '..', '..', fileName), 'utf8');

        expect(readme).toContain('fr-CA');
        expect(readme).toContain('es-419');
        expect(readme).toContain('pt-PT');
        expect(readme).toContain('zh-Hans');
        expect(readme).toContain('zh-Hant-HK');
    });
});
